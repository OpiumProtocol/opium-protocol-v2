pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./OpiumProxyFactory.sol";
import "./OracleAggregator.sol";
import "./SyntheticAggregator.sol";
import "./TokenSpender.sol";
import "./Interface/IDerivativeLogic.sol";
import "./Interface/ISyntheticAggregator.sol";

import "./Registry/RegistryEntities.sol";

import "./Lib/LibDerivative.sol";
import "./Lib/LibPosition.sol";
import "./Lib/UsingRegistryACL.sol";
import "./Lib/LibCalculator.sol";

// import "hardhat/console.sol";

/// @title Opium.Core contract creates positions, holds and distributes margin at the maturity
contract Core is UsingRegistryACL, ReentrancyGuardUpgradeable {
    using LibDerivative for LibDerivative.Derivative;
    using LibCalculator for uint256;
    using LibPosition for bytes32;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Emitted when Core creates new position
    event LogCreated(address _buyer, address _seller, bytes32 _derivativeHash, uint256 _amount);
    // Emitted when Core executes positions
    event LogExecuted(address _positionsOwner, address _positionAddress, uint256 _amount);
    // Emitted when Core cancels ticker for the first time
    event LogCanceled(bytes32 _derivativeHash);
    // Emitted when Core redeems an amount of market neutral positions
    event LogRedeem(uint256 _amount, bytes32 _derivativeHash);

    RegistryEntities.ProtocolCommissionArgs private protocolCommissionArgs;

    struct CreateLocalVars {
        SyntheticAggregator syntheticAggregator;
        IDerivativeLogic derivativeLogic;
        IERC20Upgradeable marginToken;
        TokenSpender tokenSpender;
        OpiumProxyFactory opiumProxyFactory;
    }

    // Vaults for p2p derivatives
    // This mapping holds balances of p2p positions
    // p2pVaults[derivativeHash] => availableBalance
    mapping(bytes32 => uint256) public p2pVaults;

    // Vaults for fees
    // This mapping holds balances of fee recipients
    // feesVaults[feeRecipientAddress][tokenAddress] => availableBalance
    mapping(address => mapping(address => uint256)) public feesVaults;

    // Hashes of cancelled tickers
    mapping(bytes32 => bool) public cancelled;

    /// @notice Calls Core.Lib.__UsingRegistryACL__init constructor
    function initialize(address _registry) external initializer {
        __UsingRegistryACL__init(_registry);
        protocolCommissionArgs = registry.getProtocolCommissionParams();
    }

    // EXTERNAL FUNCTIONS

    /// @notice This function allows fee recipients to withdraw their fees
    /// @param _tokenAddress address Address of an ERC20 token to withdraw
    function withdrawFee(address _tokenAddress) external nonReentrant whenNotPaused {
        uint256 balance = feesVaults[msg.sender][_tokenAddress];
        feesVaults[msg.sender][_tokenAddress] = 0;
        IERC20Upgradeable(_tokenAddress).safeTransfer(msg.sender, balance);
    }

    /// @notice This function creates p2p positions
    /// @param _derivative LibDerivative.Derivative Derivative definition
    /// @param _amount uint256 Amount of positions to create
    /// @param _addresses address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address
    function create(
        LibDerivative.Derivative calldata _derivative,
        uint256 _amount,
        address[2] calldata _addresses
    ) external whenNotPaused nonReentrant {
        require(
            (10**protocolCommissionArgs.precisionFactor).modWithPrecisionFactor(_derivative.margin * _amount) == 0,
            "C5"
        ); //wrong mod
        // Local variables
        CreateLocalVars memory vars;
        RegistryEntities.ExecuteAndCancelLocalVars memory protocolAddresses = registry.getExecuteAndCancelLocalVars();

        // Create instance of Opium.SyntheticAggregator
        // Create instance of Opium.IDerivativeLogic
        // Create instance of margin token
        // Create instance of Opium.TokenSpender
        // Create instance of Opium.OpiumProxyFactory
        vars.syntheticAggregator = SyntheticAggregator(protocolAddresses.syntheticAggregator);
        vars.derivativeLogic = IDerivativeLogic(_derivative.syntheticId);
        vars.marginToken = IERC20Upgradeable(_derivative.token);
        vars.tokenSpender = TokenSpender(registry.getTokenSpender());
        vars.opiumProxyFactory = OpiumProxyFactory(protocolAddresses.opiumProxyFactory);

        // Generate hash for derivative
        bytes32 derivativeHash = _derivative.getDerivativeHash();

        // Check if ticker was canceled
        require(!cancelled[derivativeHash], "C7"); //ERROR_CORE_TICKER_WAS_CANCELLED

        // Validate input data against Derivative logic (`syntheticId`)
        require(vars.derivativeLogic.validateInput(_derivative), "C8"); //ERROR_CORE_SYNTHETIC_VALIDATION_ERROR

        uint256[2] memory margins;
        // Get cached margin required according to logic from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = vars.syntheticAggregator.getMargin(derivativeHash, _derivative);

        uint256 totalMargin = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(
            margins[0] + margins[1],
            _amount
        );

        // Check ERC20 tokens allowance: (margins[0] + margins[1]) * amount
        // `msg.sender` must provide margin for position creation
        require(
            vars.marginToken.allowance(msg.sender, address(vars.tokenSpender)) >= totalMargin,
            "C12" //ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE
        );

        // Take ERC20 tokens from msg.sender, should never revert in correct ERC20 implementation
        vars.tokenSpender.claimTokens(vars.marginToken, msg.sender, address(this), totalMargin);

        // Increment p2p positions balance by collected margin: vault += (margins[0] + margins[1]) * _amount
        _increaseP2PVault(derivativeHash, totalMargin);

        // Mint LONG and SHORT positions tokens
        vars.opiumProxyFactory.mint(_addresses[0], _addresses[1], derivativeHash, _derivative, _amount);

        emit LogCreated(_addresses[0], _addresses[1], derivativeHash, _amount);
    }

    /// @notice Executes a single position of `msg.sender` with specified `positionAddress`
    /// @param _positionAddress address `positionAddress` of position that needs to be executed
    /// @param _amount uint256 Amount of positions to execute
    function execute(address _positionAddress, uint256 _amount) external nonReentrant {
        _execute(msg.sender, _positionAddress, _amount);
    }

    /// @notice Executes a single position of `_positionsOwner` with specified `positionAddress`
    /// @param _positionOwner address Address of the owner of positions
    /// @param _positionAddress address `positionAddress` of positions that needs to be executed
    /// @param _amount uint256 Amount of positions to execute
    function execute(
        address _positionOwner,
        address _positionAddress,
        uint256 _amount
    ) external nonReentrant {
        _execute(_positionOwner, _positionAddress, _amount);
    }

    /// @notice Executes several positions of `msg.sender` with different `positionAddresses`
    /// @param _positionsAddresses address[] `positionAddresses` of positions that need to be executed
    /// @param _amounts uint256[] Amount of positions to execute for each `positionAddress`
    function execute(address[] calldata _positionsAddresses, uint256[] calldata _amounts) external nonReentrant {
        require(_positionsAddresses.length == _amounts.length, "C1"); //ERROR_CORE_ADDRESSES_AND_AMOUNTS_LENGTH_DO_NOT_MATCH
        for (uint256 i; i < _positionsAddresses.length; i++) {
            _execute(msg.sender, _positionsAddresses[i], _amounts[i]);
        }
    }

    /// @notice Executes several positions of `_positionsOwner` with different `positionAddresses`
    /// @param _positionsOwner address Address of the owner of positions
    /// @param _positionsAddresses address[] `positionAddresses` of positions that need to be executed
    /// @param _amounts uint256[] Amount of positions to execute for each `positionAddresses`
    function execute(
        address _positionsOwner,
        address[] calldata _positionsAddresses,
        uint256[] calldata _amounts
    ) external nonReentrant {
        require(_positionsAddresses.length == _amounts.length, "C1"); //ERROR_CORE_ADDRESSES_AND_AMOUNTS_LENGTH_DO_NOT_MATCH
        for (uint256 i; i < _positionsAddresses.length; i++) {
            _execute(_positionsOwner, _positionsAddresses[i], _amounts[i]);
        }
    }

    /// @notice Redeems a single market neutral position pair
    /// @param _positionAddresses address[2] `_positionAddresses` of the positions that need to be redeemed
    /// @param _amount uint256 Amount of tokens to redeem
    function redeem(address[2] calldata _positionAddresses, uint256 _amount) external nonReentrant {
        _redeem(msg.sender, _positionAddresses, _amount);
    }

    /// @notice Redeems several market neutral position pairs
    /// @param _positionsAddresses address[2][] `_positionsAddresses` of the positions that need to be redeemed
    /// @param _amounts uint256[] Amount of tokens to redeem for each position pair
    function redeem(address[2][] calldata _positionsAddresses, uint256[] calldata _amounts) external nonReentrant {
        require(_positionsAddresses.length == _amounts.length, "C1"); //ERROR_CORE_ADDRESSES_AND_AMOUNTS_LENGTH_DO_NOT_MATCH
        for (uint256 i = 0; i < _positionsAddresses.length; i++) {
            _redeem(msg.sender, _positionsAddresses[i], _amounts[i]);
        }
    }

    /// @notice Redeems market neutral position for a `_positionAddresses` pair
    /// @param _positionsOwner address `positionsOwner` owner of the `positionAddresses` pair
    /// @param _positionAddresses address[2] `positionAddresses` of the position that needs to be burnt
    function _redeem(
        address _positionsOwner,
        address[2] memory _positionAddresses,
        uint256 _amount
    ) private whenNotPaused {
        uint256 shortBalance = IERC20Upgradeable(_positionAddresses[0]).balanceOf(_positionsOwner);
        uint256 longBalance = IERC20Upgradeable(_positionAddresses[1]).balanceOf(_positionsOwner);
        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[0]
        ).getPositionTokenData();
        IOpiumPositionToken.OpiumPositionTokenParams memory longOpiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[1]
        ).getPositionTokenData();
        require(opiumPositionTokenParams.derivativeHash == longOpiumPositionTokenParams.derivativeHash, "C2"); //WRONG_HASH
        require(
            opiumPositionTokenParams.positionType == LibDerivative.PositionType.SHORT,
            "C3" //WRONG_POSITION_TYPE
        );
        require(
            longOpiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG,
            "C3" //WRONG_POSITION_TYPE
        );
        require(shortBalance >= _amount, "C4"); //NOT_ENOUGH_POSITIONS
        require(longBalance >= _amount, "C4"); //NOT_ENOUGH_POSITIONS

        RegistryEntities.ExecuteAndCancelLocalVars memory vars = registry.getExecuteAndCancelLocalVars();

        OpiumProxyFactory(vars.opiumProxyFactory).burn(_positionsOwner, _positionAddresses[0], _amount);
        OpiumProxyFactory(vars.opiumProxyFactory).burn(_positionsOwner, _positionAddresses[1], _amount);

        ISyntheticAggregator.SyntheticCache memory syntheticCache = ISyntheticAggregator(vars.syntheticAggregator)
            .getSyntheticCache(opiumPositionTokenParams.derivativeHash, opiumPositionTokenParams.derivative);

        uint256 totalMargin = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(
            syntheticCache.buyerMargin + syntheticCache.sellerMargin,
            _amount
        );
        uint256 fees = _getFees(
            syntheticCache.authorAddress,
            syntheticCache.commission,
            opiumPositionTokenParams.derivative.token,
            totalMargin
        );

        IERC20Upgradeable(opiumPositionTokenParams.derivative.token).safeTransfer(_positionsOwner, totalMargin - fees);
        emit LogRedeem(_amount, opiumPositionTokenParams.derivativeHash);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionAddress PositionType of positions to be canceled
    /// @param _amount uint256 Amount of positions to cancel
    function cancel(address _positionAddress, uint256 _amount) external nonReentrant whenNotPaused {
        _cancel(_positionAddress, _amount);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionsAddresses PositionTypes of positions to be canceled
    /// @param _amounts uint256[] Amount of positions to cancel for each `positionAddress`
    function cancel(address[] calldata _positionsAddresses, uint256[] calldata _amounts) external nonReentrant {
        require(_positionsAddresses.length == _amounts.length, "C1");
        for (uint256 i; i < _positionsAddresses.length; i++) {
            _cancel(_positionsAddresses[i], _amounts[i]);
        }
    }

    /// @notice Executes several positions of `_positionOwner` with different `positionAddresses`
    /// @param _positionOwner address Address of the owner of positions
    /// @param _positionAddress address[] `positionAddresses` of positions that needs to be executed
    /// @param _amount uint256 Amount of positions to execute for each `positionAddress`
    function _execute(
        address _positionOwner,
        address _positionAddress,
        uint256 _amount
    ) private onlyOpiumFactoryTokens(_positionAddress) whenNotPaused {
        // Local variables
        RegistryEntities.ExecuteAndCancelLocalVars memory vars = registry.getExecuteAndCancelLocalVars();

        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddress
        ).getPositionTokenData();

        // Check if execution is performed after endTime
        require(block.timestamp > opiumPositionTokenParams.derivative.endTime, "C10"); //ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED

        // Checking whether execution is performed by `_positionsOwner` or `_positionsOwner` allowed third party executions on it's behalf
        require(
            _positionOwner == msg.sender ||
                IDerivativeLogic(opiumPositionTokenParams.derivative.syntheticId).thirdpartyExecutionAllowed(
                    _positionOwner
                ),
            "C11" //ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED
        );

        // Returns payout for all positions
        uint256 payout = _getPayout(
            opiumPositionTokenParams.derivative,
            opiumPositionTokenParams.positionType,
            opiumPositionTokenParams.derivativeHash,
            _amount,
            vars
        );

        // Transfer payout
        if (payout > 0) {
            IERC20Upgradeable(opiumPositionTokenParams.derivative.token).safeTransfer(_positionOwner, payout);
        }
        // Burn executed position tokens
        OpiumProxyFactory(vars.opiumProxyFactory).burn(_positionOwner, _positionAddress, _amount);

        emit LogExecuted(_positionOwner, _positionAddress, _amount);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionAddress PositionTypes of positions to be canceled
    /// @param _amount uint256[] Amount of positions to cancel for each `positionAddress`
    function _cancel(address _positionAddress, uint256 _amount)
        private
        onlyOpiumFactoryTokens(_positionAddress)
        whenNotPaused
    {
        // Local variables
        RegistryEntities.ExecuteAndCancelLocalVars memory vars = registry.getExecuteAndCancelLocalVars();
        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddress
        ).getPositionTokenData();
        // Don't allow to cancel tickers with "dummy" oracleIds
        require(opiumPositionTokenParams.derivative.oracleId != address(0), "C6"); //ERROR_CORE_CANT_CANCEL_DUMMY_ORACLE_ID

        // Check if cancellation is called after `NO_DATA_CANCELLATION_PERIOD` and `oracleId` didn't provided data
        require(
            opiumPositionTokenParams.derivative.endTime + protocolCommissionArgs.noDataCancellationPeriod <=
                block.timestamp &&
                !OracleAggregator(vars.oracleAggregator).hasData(
                    opiumPositionTokenParams.derivative.oracleId,
                    opiumPositionTokenParams.derivative.endTime
                ),
            "C13" //ERROR_CORE_CANCELLATION_IS_NOT_ALLOWED
        );

        // Emit `Canceled` event only once and mark ticker as canceled
        if (!cancelled[opiumPositionTokenParams.derivativeHash]) {
            cancelled[opiumPositionTokenParams.derivativeHash] = true;
            emit LogCanceled(opiumPositionTokenParams.derivativeHash);
        }

        uint256[2] memory margins;
        // Get cached margin required according to logic from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = SyntheticAggregator(vars.syntheticAggregator).getMargin(
            opiumPositionTokenParams.derivativeHash,
            opiumPositionTokenParams.derivative
        );

        uint256 payout;
        // Check if `_positionAddresses` is a LONG position
        if (opiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG) {
            // Set payout to buyerPayout
            payout = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(margins[0], _amount);

            // Check if `positionAddress` is a SHORT position
        } else {
            // Set payout to sellerPayout
            payout = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(margins[1], _amount);
        }
        _decreaseP2PVault(opiumPositionTokenParams.derivativeHash, payout);

        // Transfer payout * _amounts[i]
        if (payout > 0) {
            IERC20Upgradeable(opiumPositionTokenParams.derivative.token).safeTransfer(msg.sender, payout);
        }

        // Burn canceled position tokens
        OpiumProxyFactory(vars.opiumProxyFactory).burn(msg.sender, _positionAddress, _amount);
    }

    /// @notice Calculates payout for position and gets fees
    /// @param _derivative Derivative Derivative definition
    /// @param _positionType address `positionAddress` of positions
    /// @param _amount uint256 Amount of positions
    /// @param _vars ExecuteAndCancelLocalVars Helping local variables
    /// @return payout uint256 Payout for all tokens
    function _getPayout(
        LibDerivative.Derivative memory _derivative,
        LibDerivative.PositionType _positionType,
        bytes32 _derivativeHash,
        uint256 _amount,
        RegistryEntities.ExecuteAndCancelLocalVars memory _vars
    ) private returns (uint256 payout) {
        // Trying to getData from Opium.OracleAggregator, could be reverted
        // Opium allows to use "dummy" oracleIds, in this case data is set to `0`
        uint256 data;
        if (_derivative.oracleId != address(0)) {
            data = OracleAggregator(_vars.oracleAggregator).getData(_derivative.oracleId, _derivative.endTime);
        } else {
            data = 0;
        }

        uint256[2] memory payoutRatio;
        // Get payout ratio from Derivative logic
        // payoutRatio[0] - buyerPayout
        // payoutRatio[1] - sellerPayout
        (payoutRatio[0], payoutRatio[1]) = IDerivativeLogic(_derivative.syntheticId).getExecutionPayout(
            _derivative,
            data
        );

        // Check if ticker was canceled
        require(!cancelled[_derivativeHash], "C7"); //ERROR_CORE_TICKER_WAS_CANCELLED

        ISyntheticAggregator.SyntheticCache memory syntheticCache = ISyntheticAggregator(_vars.syntheticAggregator)
            .getSyntheticCache(_derivativeHash, _derivative);

        uint256[2] memory payouts;
        // Calculate payouts from ratio
        // payouts[0] -> buyerPayout = (buyerMargin + sellerMargin) * buyerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
        // payouts[1] -> sellerPayout = (buyerMargin + sellerMargin) * sellerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
        payouts[0] =
            ((syntheticCache.buyerMargin + syntheticCache.sellerMargin) * payoutRatio[0]) /
            (payoutRatio[0] + payoutRatio[1]);
        payouts[1] =
            ((syntheticCache.buyerMargin + syntheticCache.sellerMargin) * payoutRatio[1]) /
            (payoutRatio[0] + payoutRatio[1]);

        // Check if `_positionType` is LONG
        if (_positionType == LibDerivative.PositionType.LONG) {
            // Set payout to buyerPayout
            payout = payouts[0];

            // Multiply payout by amount
            payout = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(payout, _amount);

            uint256 longMargin = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(
                syntheticCache.buyerMargin,
                _amount
            );
            _decreaseP2PVault(_derivativeHash, payout);

            // Take fees only from profit makers
            // Check: payout > buyerMargin * amount
            if (payout > longMargin) {
                // Get Opium and `syntheticId` author fees and subtract it from payout
                payout =
                    payout -
                    (
                        _getFees(
                            syntheticCache.authorAddress,
                            syntheticCache.commission,
                            _derivative.token,
                            payout - longMargin
                        )
                    );
            }

            // Check if `_positionType` is a SHORT position
        } else {
            // Set payout to sellerPayout
            payout = payouts[1];

            // Multiply payout by amount
            payout = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(payout, _amount);
            uint256 shortMargin = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(
                syntheticCache.sellerMargin,
                _amount
            );

            _decreaseP2PVault(_derivativeHash, payout);
            // Take fees only from profit makers
            // Check: payout > sellerMargin * amount

            if (payout > shortMargin) {
                // Get Opium fees and subtract it from payout
                payout =
                    payout -
                    (
                        _getFees(
                            syntheticCache.authorAddress,
                            syntheticCache.commission,
                            _derivative.token,
                            payout - shortMargin
                        )
                    );
            }
        }
    }

    /// @notice Calculates `syntheticId` author and opium fees from profit makers
    /// @param _profit uint256 payout of one position
    /// @return fee uint256 Opium and `syntheticId` author fee
    function _getFees(
        address _authorAddress,
        uint256 _authorCommission,
        address _tokenAddress,
        uint256 _profit
    ) private returns (uint256 fee) {
        // Calculate fee
        // fee = profit * commission / COMMISSION_BASE
        fee = (_profit * _authorCommission) / protocolCommissionArgs.derivativeAuthorCommissionBase;

        // If commission is zero, finish
        if (fee == 0) {
            return 0;
        }

        // Calculate opium fee
        // opiumFee = fee * OPIUM_COMMISSION_PART / OPIUM_COMMISSION_BASE
        uint256 opiumFee = (fee * protocolCommissionArgs.protocolCommissionPart) /
            protocolCommissionArgs.protocolFeeCommissionBase;

        // Calculate author fee
        // authorFee = fee - opiumFee
        uint256 authorFee = fee - opiumFee;

        // Get opium address
        address opiumFeeReceiver = registry.getOpiumFeeReceiver();

        // Update feeVault for Opium team
        // feesVault[opium][token] += opiumFee
        feesVaults[opiumFeeReceiver][_tokenAddress] = feesVaults[opiumFeeReceiver][_tokenAddress] + opiumFee;

        // Update feeVault for `syntheticId` author
        // feeVault[author][token] += authorFee
        feesVaults[_authorAddress][_tokenAddress] = feesVaults[_authorAddress][_tokenAddress] + authorFee;
    }

    function _increaseP2PVault(bytes32 _derivativeHash, uint256 _amount) private {
        p2pVaults[_derivativeHash] = p2pVaults[_derivativeHash] + _amount;
    }

    function _decreaseP2PVault(bytes32 _derivativeHash, uint256 _amount) private {
        require(p2pVaults[_derivativeHash] >= _amount, "C9"); //ERROR_CORE_INSUFFICIENT_P2P_BALANCE
        p2pVaults[_derivativeHash] = p2pVaults[_derivativeHash] - _amount;
    }
}
