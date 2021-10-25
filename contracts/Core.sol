pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./TokenSpender.sol";
import "./Registry/RegistryEntities.sol";
import "./Interface/IOpiumProxyFactory.sol";
import "./Interface/IOpiumPositionToken.sol";
import "./Interface/ISyntheticAggregator.sol";
import "./Interface/IOracleAggregator.sol";
import "./Interface/IDerivativeLogic.sol";
import "./Interface/IRegistry.sol";
import "./Lib/LibDerivative.sol";
import "./Lib/LibPosition.sol";
import "./Lib/LibCalculator.sol";
import "hardhat/console.sol";

/**
    Error codes:
    - C1 = ERROR_CORE_ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH
    - C2 = ERROR_CORE_WRONG_HASH
    - C3 = ERROR_CORE_WRONG_POSITION_TYPE
    - C4 = ERROR_CORE_NOT_ENOUGH_POSITIONS
    - C5 = ERROR_CORE_WRONG_MOD
    - C6 = ERROR_CORE_CANT_CANCEL_DUMMY_ORACLE_ID
    - C7 = ERROR_CORE_TICKER_WAS_CANCELLED
    - C8 = ERROR_CORE_SYNTHETIC_VALIDATION_ERROR
    - C9 = ERROR_CORE_INSUFFICIENT_P2P_BALANCE
    - C10 = ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED
    - C11 = ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED
    - C12 = ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE
    - C13 = ERROR_CORE_CANCELLATION_IS_NOT_ALLOWED
 */

/// @title Opium.Core contract creates positions, holds and distributes margin at the maturity
contract Core is ReentrancyGuardUpgradeable {
    using LibDerivative for LibDerivative.Derivative;
    using LibCalculator for uint256;
    using LibPosition for bytes32;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Emitted when Core creates a new LONG/SHORT position pair
    event LogCreated(address _buyer, address _seller, bytes32 _derivativeHash, uint256 _amount);
    // Emitted when Core mints an amount of LONG/SHORT positions
    event LogMinted(bytes32 _derivativeHash, uint256 _amount);
    // Emitted when Core executes positions
    event LogExecuted(address _positionsOwner, address _positionAddress, uint256 _amount);
    // Emitted when Core cancels ticker for the first time
    event LogCanceled(bytes32 _derivativeHash);
    // Emitted when Core redeems an amount of market neutral positions
    event LogRedeem(uint256 _amount, bytes32 _derivativeHash);

    IRegistry private registry;

    RegistryEntities.ProtocolCommissionArgs private protocolCommissionArgs;
    RegistryEntities.ProtocolAddressesArgs private protocolAddressesArgs;

    // Vaults for p2p derivatives
    // This mapping holds balances of p2p positions
    // p2pVaults[derivativeHash] => availableBalance
    mapping(bytes32 => uint256) private p2pVaults;

    // Derivative payouts cache
    // Once paid out (executed), the payout ratio is stored in cache
    mapping(bytes32 => uint256[2]) private derivativePayouts;

    // Vaults for fees
    // This mapping holds balances of fee recipients
    // feesVaults[feeRecipientAddress][tokenAddress] => availableBalance
    mapping(address => mapping(address => uint256)) private feesVaults;

    // Hashes of cancelled tickers
    mapping(bytes32 => bool) private cancelled;

    modifier whenNotPaused() {
        require(registry.isPaused() == false, "U4");
        _;
    }

    /// @notice sets registry and protocolCommissionArgs
    function initialize(address _registry) external initializer {
        registry = IRegistry(_registry);
        protocolCommissionArgs = registry.getProtocolCommissionParams();
    }

    // ****************** EXTERNAL FUNCTIONS ******************

    function updateProtocolAddresses() external {
        protocolAddressesArgs = registry.getProtocolAddresses();
    }

    function updateProtocolCommissionArgs() external {
        protocolCommissionArgs = registry.getProtocolCommissionParams();
    }


    function getFeeVaultsBalance(address _feeRecipient, address _token) external view returns(uint256) {
        return feesVaults[_feeRecipient][_token];
    }

    /// @notice This function allows fee recipients to withdraw their fees
    /// @param _tokenAddress address Address of an ERC20 token to withdraw
    function withdrawFee(address _tokenAddress) external nonReentrant whenNotPaused {
        uint256 balance = feesVaults[msg.sender][_tokenAddress];
        feesVaults[msg.sender][_tokenAddress] = 0;
        IERC20Upgradeable(_tokenAddress).safeTransfer(msg.sender, balance);
    }

    /// @notice This function deploys two ERC20 contracts representing respectively the LONG and SHORT position of the provided `LibDerivative.Derivative` derivative and mints the provided amount of SHORT positions to a seller and LONG positions to a buyer
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
        // _setProtocolAddresses();
        uint256 _multiplier = 10**protocolCommissionArgs.precisionFactor;
        require(_multiplier.modWithPrecisionFactor(_derivative.margin * _amount) == 0, "C5"); //wrong mod

        // Generate hash for derivative
        bytes32 derivativeHash = _derivative.getDerivativeHash();

        // Check if ticker was canceled
        require(!cancelled[derivativeHash], "C7"); //ERROR_CORE_TICKER_WAS_CANCELLED

        // Validate input data against Derivative logic (`syntheticId`)
        require(IDerivativeLogic(_derivative.syntheticId).validateInput(_derivative), "C8"); //ERROR_CORE_SYNTHETIC_VALIDATION_ERROR

        uint256[2] memory margins;
        // Get cached margin required according to logic from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = ISyntheticAggregator(protocolAddressesArgs.syntheticAggregator).getMargin(
            derivativeHash,
            _derivative
        );

        uint256 totalMargin = _multiplier.mulWithPrecisionFactor(margins[0] + margins[1], _amount);

        // Check ERC20 tokens allowance: (margins[0] + margins[1]) * amount
        // `msg.sender` must provide margin for position creation
        require(
            IERC20Upgradeable(_derivative.token).allowance(msg.sender, address(protocolAddressesArgs.tokenSpender)) >=
                totalMargin,
            "C12" //ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE
        );

        // Take ERC20 tokens from msg.sender, should never revert in correct ERC20 implementation
        protocolAddressesArgs.tokenSpender.claimTokens(
            IERC20Upgradeable(_derivative.token),
            msg.sender,
            address(this),
            totalMargin
        );

        // Increment p2p positions balance by collected margin: vault += (margins[0] + margins[1]) * _amount
        _increaseP2PVault(derivativeHash, totalMargin);

        // Mint LONG and SHORT positions tokens
        protocolAddressesArgs.opiumProxyFactory.create(
            _addresses[0],
            _addresses[1],
            _amount,
            derivativeHash,
            _derivative
        );

        emit LogCreated(_addresses[0], _addresses[1], derivativeHash, _amount);
    }

    /// @notice This function mints the provided amount of LONG/SHORT positions to msg.sender for a previously deployed pair of LONG/SHORT ERC20 contracts
    /// @param _amount uint256 Amount of positions to create
    /// @param _positionAddresses address[2] Addresses of buyer and seller
    /// [0] - LONG erc20 position address
    /// [1] - SHORT erc20 position address
    function mint(uint256 _amount, address[2] calldata _positionAddresses) external whenNotPaused nonReentrant {
        // _setProtocolAddresses();
        uint256 _multiplier = 10**protocolCommissionArgs.precisionFactor;

        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[0]
        ).getPositionTokenData();
        IOpiumPositionToken.OpiumPositionTokenParams memory longOpiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[1]
        ).getPositionTokenData();
        require(_multiplier.modWithPrecisionFactor(opiumPositionTokenParams.derivative.margin * _amount) == 0, "C5"); //wrong mod
        require(opiumPositionTokenParams.derivativeHash == longOpiumPositionTokenParams.derivativeHash, "C2"); //WRONG_HASH
        require(
            opiumPositionTokenParams.positionType == LibDerivative.PositionType.SHORT,
            "C3" //WRONG_POSITION_TYPE
        );
        require(
            longOpiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG,
            "C3" //WRONG_POSITION_TYPE
        );

        // Check if ticker was canceled
        require(!cancelled[opiumPositionTokenParams.derivativeHash], "C7"); //ERROR_CORE_TICKER_WAS_CANCELLED

        // Validate input data against Derivative logic (`syntheticId`)
        require(
            IDerivativeLogic(opiumPositionTokenParams.derivative.syntheticId).validateInput(
                opiumPositionTokenParams.derivative
            ),
            "C8"
        ); //ERROR_CORE_SYNTHETIC_VALIDATION_ERROR

        uint256[2] memory margins;
        // Get cached margin required according to logic from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = ISyntheticAggregator(protocolAddressesArgs.syntheticAggregator).getMargin(
            opiumPositionTokenParams.derivativeHash,
            opiumPositionTokenParams.derivative
        );

        uint256 totalMargin = _multiplier.mulWithPrecisionFactor(margins[0] + margins[1], _amount);

        // Check ERC20 tokens allowance: (margins[0] + margins[1]) * amount
        // `msg.sender` must provide margin for position creation
        require(
            IERC20Upgradeable(opiumPositionTokenParams.derivative.token).allowance(
                msg.sender,
                address(protocolAddressesArgs.tokenSpender)
            ) >= totalMargin,
            "C12" //ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE
        );

        // Take ERC20 tokens from msg.sender, should never revert in correct ERC20 implementation
        protocolAddressesArgs.tokenSpender.claimTokens(
            IERC20Upgradeable(opiumPositionTokenParams.derivative.token),
            msg.sender,
            address(this),
            totalMargin
        );

        // Increment p2p positions balance by collected margin: vault += (margins[0] + margins[1]) * _amount
        _increaseP2PVault(opiumPositionTokenParams.derivativeHash, totalMargin);

        // Mint LONG and SHORT positions tokens
        protocolAddressesArgs.opiumProxyFactory.mintPair(
            msg.sender,
            msg.sender,
            _positionAddresses[0],
            _positionAddresses[1],
            _amount
        );

        emit LogMinted(opiumPositionTokenParams.derivativeHash, _amount);
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

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `protocolCommissionArgs.noDataCancellationPeriod`
    /// @param _positionAddress PositionType of positions to be canceled
    /// @param _amount uint256 Amount of positions to cancel
    function cancel(address _positionAddress, uint256 _amount) external nonReentrant {
        _cancel(_positionAddress, _amount);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `protocolCommissionArgs.noDataCancellationPeriod`
    /// @param _positionsAddresses PositionTypes of positions to be canceled
    /// @param _amounts uint256[] Amount of positions to cancel for each `positionAddress`
    function cancel(address[] calldata _positionsAddresses, uint256[] calldata _amounts) external nonReentrant {
        require(_positionsAddresses.length == _amounts.length, "C1");
        for (uint256 i; i < _positionsAddresses.length; i++) {
            _cancel(_positionsAddresses[i], _amounts[i]);
        }
    }

    // ****************** PRIVATE FUNCTIONS ******************

    /// @notice Redeems market neutral position for a `_positionAddresses` pair
    /// @param _positionsOwner address `positionsOwner` owner of the `positionAddresses` pair
    /// @param _positionAddresses address[2] `positionAddresses` of the position that needs to be burnt
    function _redeem(
        address _positionsOwner,
        address[2] memory _positionAddresses,
        uint256 _amount
    ) private whenNotPaused {
        // _setProtocolAddresses();
        uint256 shortBalance = IERC20Upgradeable(_positionAddresses[0]).balanceOf(_positionsOwner);
        uint256 longBalance = IERC20Upgradeable(_positionAddresses[1]).balanceOf(_positionsOwner);
        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[0]
        ).getPositionTokenData();
        IOpiumPositionToken.OpiumPositionTokenParams memory longOpiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[1]
        ).getPositionTokenData();
        _onlyOpiumFactoryTokens(_positionAddresses[0], opiumPositionTokenParams);
        _onlyOpiumFactoryTokens(_positionAddresses[1], longOpiumPositionTokenParams);
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

        ISyntheticAggregator.SyntheticCache memory syntheticCache = protocolAddressesArgs
            .syntheticAggregator
            .getSyntheticCache(opiumPositionTokenParams.derivativeHash, opiumPositionTokenParams.derivative);

        uint256 totalMargin = (10**protocolCommissionArgs.precisionFactor).mulWithPrecisionFactor(
            syntheticCache.buyerMargin + syntheticCache.sellerMargin,
            _amount
        );
        uint256 fees = _getFees(
            syntheticCache.authorAddress,
            syntheticCache.authorCommission,
            opiumPositionTokenParams.derivative.token,
            totalMargin
        );

        IERC20Upgradeable(opiumPositionTokenParams.derivative.token).safeTransfer(_positionsOwner, totalMargin - fees);
        protocolAddressesArgs.opiumProxyFactory.burnPair(
            _positionsOwner,
            _positionAddresses[0],
            _positionAddresses[1],
            _amount
        );
        emit LogRedeem(_amount, opiumPositionTokenParams.derivativeHash);
    }

    /// @notice Executes several positions of `_positionOwner` with different `positionAddresses`
    /// @param _positionOwner address Address of the owner of positions
    /// @param _positionAddress address[] `positionAddresses` of positions that needs to be executed
    /// @param _amount uint256 Amount of positions to execute for each `positionAddress`
    function _execute(
        address _positionOwner,
        address _positionAddress,
        uint256 _amount
    ) private whenNotPaused {
        // _setProtocolAddresses();
        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddress
        ).getPositionTokenData();
        _onlyOpiumFactoryTokens(_positionAddress, opiumPositionTokenParams);

        // Check if execution is performed after endTime
        require(block.timestamp > opiumPositionTokenParams.derivative.endTime, "C10");

        // Checking whether execution is performed by `_positionsOwner` or `_positionsOwner` allowed third party executions on it's behalf
        require(
            _positionOwner == msg.sender ||
                IDerivativeLogic(opiumPositionTokenParams.derivative.syntheticId).thirdpartyExecutionAllowed(
                    _positionOwner
                ),
            "C11"
        );

        // Returns payout for all positions
        uint256 payout = _getPayout(
            opiumPositionTokenParams,
            _amount,
            protocolAddressesArgs.syntheticAggregator,
            protocolAddressesArgs.oracleAggregator
        );

        // Transfer payout
        if (payout > 0) {
            IERC20Upgradeable(opiumPositionTokenParams.derivative.token).safeTransfer(_positionOwner, payout);
        }
        // Burn executed position tokens
        protocolAddressesArgs.opiumProxyFactory.burn(_positionOwner, _positionAddress, _amount);

        emit LogExecuted(_positionOwner, _positionAddress, _amount);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `protocolCommissionArgs.noDataCancellationPeriod`
    /// @param _positionAddress PositionTypes of positions to be canceled
    /// @param _amount uint256[] Amount of positions to cancel for each `positionAddress`
    function _cancel(address _positionAddress, uint256 _amount) private whenNotPaused {
        // _setProtocolAddresses();
        uint256 _multiplier = 10**protocolCommissionArgs.precisionFactor;
        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddress
        ).getPositionTokenData();
        _onlyOpiumFactoryTokens(_positionAddress, opiumPositionTokenParams);

        // Don't allow to cancel tickers with "dummy" oracleIds
        require(opiumPositionTokenParams.derivative.oracleId != address(0), "C6");

        // Check if cancellation is called after `protocolCommissionArgs.noDataCancellationPeriod` and `oracleId` didn't provided data
        require(
            opiumPositionTokenParams.derivative.endTime + protocolCommissionArgs.noDataCancellationPeriod <=
                block.timestamp &&
                !protocolAddressesArgs.oracleAggregator.hasData(
                    opiumPositionTokenParams.derivative.oracleId,
                    opiumPositionTokenParams.derivative.endTime
                ),
            "C13"
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
        (margins[0], margins[1]) = protocolAddressesArgs.syntheticAggregator.getMargin(
            opiumPositionTokenParams.derivativeHash,
            opiumPositionTokenParams.derivative
        );

        uint256 payout;
        // Check if `_positionAddresses` is a LONG position
        if (opiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG) {
            // Set payout to buyerPayout
            payout = _multiplier.mulWithPrecisionFactor(margins[0], _amount);

            // Check if `positionAddress` is a SHORT position
        } else {
            // Set payout to sellerPayout
            payout = _multiplier.mulWithPrecisionFactor(margins[1], _amount);
        }
        _decreaseP2PVault(opiumPositionTokenParams.derivativeHash, payout);

        // Transfer payout * _amounts[i]
        if (payout > 0) {
            IERC20Upgradeable(opiumPositionTokenParams.derivative.token).safeTransfer(msg.sender, payout);
        }

        // Burn canceled position tokens
        protocolAddressesArgs.opiumProxyFactory.burn(msg.sender, _positionAddress, _amount);
    }

    function _getPayout(
        IOpiumPositionToken.OpiumPositionTokenParams memory _opiumPositionTokenParams,
        uint256 _amount,
        ISyntheticAggregator _syntheticAggregator,
        IOracleAggregator _oracleAggregator
    ) private returns (uint256 payout) {
        // // Check if ticker was canceled
        require(!cancelled[_opiumPositionTokenParams.derivativeHash], "C7"); //ERROR_CORE_TICKER_WAS_CANCELLED

        // Trying to getData from Opium.OracleAggregator, could be reverted
        // Opium allows to use "dummy" oracleIds, in this case data is set to `0`
        uint256 data;
        if (_opiumPositionTokenParams.derivative.oracleId != address(0)) {
            data = _oracleAggregator.getData(
                _opiumPositionTokenParams.derivative.oracleId,
                _opiumPositionTokenParams.derivative.endTime
            );
        } else {
            data = 0;
        }

        if (
            derivativePayouts[_opiumPositionTokenParams.derivativeHash][0] == 0 &&
            derivativePayouts[_opiumPositionTokenParams.derivativeHash][1] == 0
        ) {
            // Get payout ratio from Derivative logic
            // payoutRatio[0] - buyerPayout
            // payoutRatio[1] - sellerPayout
            (uint256 buyerPayout, uint256 sellerPayout) = IDerivativeLogic(
                _opiumPositionTokenParams.derivative.syntheticId
            ).getExecutionPayout(_opiumPositionTokenParams.derivative, data);
            // Cache buyer payout
            derivativePayouts[_opiumPositionTokenParams.derivativeHash][0] = buyerPayout;
            // Cache seller payout
            derivativePayouts[_opiumPositionTokenParams.derivativeHash][1] = sellerPayout;
        }

        uint256 buyerPayoutRatio = derivativePayouts[_opiumPositionTokenParams.derivativeHash][0];
        uint256 sellerPayoutRatio = derivativePayouts[_opiumPositionTokenParams.derivativeHash][1];

        ISyntheticAggregator.SyntheticCache memory syntheticCache = ISyntheticAggregator(_syntheticAggregator)
            .getSyntheticCache(_opiumPositionTokenParams.derivativeHash, _opiumPositionTokenParams.derivative);

        uint256[2] memory payouts;
        // Calculate payouts from ratio
        // payouts[0] -> buyerPayout = (buyerMargin + sellerMargin) * buyerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
        // payouts[1] -> sellerPayout = (buyerMargin + sellerMargin) * sellerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
        payouts[0] =
            ((syntheticCache.buyerMargin + syntheticCache.sellerMargin) * buyerPayoutRatio) /
            (buyerPayoutRatio + sellerPayoutRatio);
        payouts[1] =
            ((syntheticCache.buyerMargin + syntheticCache.sellerMargin) * sellerPayoutRatio) /
            (buyerPayoutRatio + sellerPayoutRatio);

        uint256 _multiplier = 10**protocolCommissionArgs.precisionFactor;

        // Check if `_positionType` is LONG
        if (_opiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG) {
            // Set payout to buyerPayout
            payout = payouts[0];

            // Multiply payout by amount
            payout = _multiplier.mulWithPrecisionFactor(payout, _amount);

            uint256 longMargin = _multiplier.mulWithPrecisionFactor(syntheticCache.buyerMargin, _amount);

            // Take fees only from profit makers
            // Check: payout > buyerMargin * amount
            if (payout > longMargin) {
                // Get Opium and `syntheticId` author fees and subtract it from payout
                payout =
                    payout -
                    (
                        _getFees(
                            syntheticCache.authorAddress,
                            syntheticCache.authorCommission,
                            _opiumPositionTokenParams.derivative.token,
                            payout - longMargin
                        )
                    );
            }

            // Check if `_positionType` is a SHORT position
        } else {
            // Set payout to sellerPayout
            payout = payouts[1];

            // Multiply payout by amount
            payout = _multiplier.mulWithPrecisionFactor(payout, _amount);
            uint256 shortMargin = _multiplier.mulWithPrecisionFactor(syntheticCache.sellerMargin, _amount);

            // Take fees only from profit makers
            // Check: payout > sellerMargin * amount

            if (payout > shortMargin) {
                // Get Opium fees and subtract it from payout
                payout =
                    payout -
                    (
                        _getFees(
                            syntheticCache.authorAddress,
                            syntheticCache.authorCommission,
                            _opiumPositionTokenParams.derivative.token,
                            payout - shortMargin
                        )
                    );
            }
        }
        _decreaseP2PVault(_opiumPositionTokenParams.derivativeHash, payout);
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

        // Update feeVault for Opium team
        // feesVault[protocolFeeReceiver][token] += protocolFee
        feesVaults[protocolAddressesArgs.protocolFeeReceiver][_tokenAddress] =
            feesVaults[protocolAddressesArgs.protocolFeeReceiver][_tokenAddress] +
            opiumFee;

        // Update feeVault for `syntheticId` author
        // feeVault[author][token] += authorFee
        feesVaults[_authorAddress][_tokenAddress] = feesVaults[_authorAddress][_tokenAddress] + authorFee;
    }

    ///@notice ensures that a token was minted by the OpiumProxyFactory
    ///@dev usage of a private function rather than a modifier to avoid `stack too deep` error
    ///@param _tokenAddress address of the erc20 token to validate
    ///@param _opiumPositionTokenParams derivatives data of the token to validate
    function _onlyOpiumFactoryTokens(
        address _tokenAddress,
        IOpiumPositionToken.OpiumPositionTokenParams memory _opiumPositionTokenParams
    ) private view {
        address predicted = _opiumPositionTokenParams.derivativeHash.predictDeterministicAddress(
            _opiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG,
            protocolAddressesArgs.opiumProxyFactory.getImplementationAddress(),
            address(protocolAddressesArgs.opiumProxyFactory)
        );
        require(_tokenAddress == predicted, "U3");
    }

    function _increaseP2PVault(bytes32 _derivativeHash, uint256 _amount) private {
        p2pVaults[_derivativeHash] = p2pVaults[_derivativeHash] + _amount;
    }

    function _decreaseP2PVault(bytes32 _derivativeHash, uint256 _amount) private {
        require(p2pVaults[_derivativeHash] >= _amount, "C9"); //ERROR_CORE_INSUFFICIENT_P2P_BALANCE
        p2pVaults[_derivativeHash] = p2pVaults[_derivativeHash] - _amount;
    }

    function _setProtocolAddresses() private {
        if (address(protocolAddressesArgs.syntheticAggregator) == address(0)) {
            protocolAddressesArgs = registry.getProtocolAddresses();
        }
    }
}
