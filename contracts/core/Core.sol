pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./TokenSpender.sol";
import "./registry/RegistryEntities.sol";
import "./base/RegistryManager.sol";
import "../interfaces/IOpiumProxyFactory.sol";
import "../interfaces/IOpiumPositionToken.sol";
import "../interfaces/ISyntheticAggregator.sol";
import "../interfaces/IOracleAggregator.sol";
import "../interfaces/IDerivativeLogic.sol";
import "../interfaces/IRegistry.sol";
import "../libs/LibDerivative.sol";
import "../libs/LibPosition.sol";
import "../libs/LibCalculator.sol";
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
    - C14 = ERROR_CORE_NOT_OPIUM_FACTORY_POSITIONS
 */

/// @title Opium.Core contract creates positions, holds and distributes margin at the maturity
contract Core is ReentrancyGuardUpgradeable, RegistryManager {
    using LibDerivative for LibDerivative.Derivative;
    using LibCalculator for uint256;
    using LibPosition for bytes32;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Emitted when Core creates a new LONG/SHORT position pair
    event LogCreated(address indexed _buyer, address indexed _seller, bytes32 indexed _derivativeHash, uint256 _amount);
    // Emitted when Core mints an amount of LONG/SHORT positions
    event LogMinted(address indexed _buyer, address indexed _seller, bytes32 indexed _derivativeHash, uint256 _amount);
    // Emitted when Core executes positions
    event LogExecuted(address indexed _positionsOwner, address indexed _positionAddress, uint256 indexed _amount);
    // Emitted when Core cancels ticker for the first time
    event LogDerivativeHashCancelled(address indexed _positionOwner, bytes32 _derivativeHash);
    // Emitted when Core cancels a position of a previously cancelled Derivative.derivativeHash
    event LogPositionCancelled(address indexed _positionOwner, bytes32 _derivativeHash);

    // Emitted when Core redeems an amount of market neutral positions
    event LogRedeem(address indexed _positionOwner, bytes32 indexed _derivativeHash, uint256 indexed _amount);

    RegistryEntities.ProtocolParametersArgs private protocolParametersArgs;
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

    /// @notice it is called only once upon deployment of the contract. It sets the current Opium.Registry address and assigns the current protocol parameters stored in the Opium.Registry to the Core.protocolParametersArgs private variable {see RegistryEntities for a description of the ProtocolParametersArgs struct}
    function initialize(address _registry) external initializer {
        __RegistryManager__init(_registry);
        protocolParametersArgs = registry.getProtocolParameters();
    }

    // ****************** EXTERNAL FUNCTIONS ******************

    /// @notice Allows to sync the Core protocol's addresses with the Registry protocol's addresses in case the registry updates at least one of them
    /// @dev should be called immediately after the deployment of the contract
    function updateProtocolAddresses() external onlyRegistryManager {
        protocolAddressesArgs = registry.getProtocolAddresses();
    }

    /// @notice Allows to set Opium Protocol parameters
    ///
    function updateProtocolParametersArgs() external onlyRegistryManager {
        protocolParametersArgs = registry.getProtocolParameters();
    }

    /// @notice Allows to set the addresses
    /// @param _feeRecipient address of the fee recipient
    /// @param _token address Address of an ERC20 token to withdraw
    function getFeeVaultsBalance(address _feeRecipient, address _token) external view returns (uint256) {
        return feesVaults[_feeRecipient][_token];
    }

    /// @notice This function allows fee recipients to withdraw their fees
    /// @param _tokenAddress address Address of an ERC20 token to withdraw
    function withdrawFee(address _tokenAddress) external nonReentrant whenNotPaused {
        uint256 balance = feesVaults[msg.sender][_tokenAddress];
        feesVaults[msg.sender][_tokenAddress] = 0;
        IERC20Upgradeable(_tokenAddress).safeTransfer(msg.sender, balance);
    }

    /// @notice It deploys two ERC20 contracts representing respectively the LONG and SHORT position of the provided `LibDerivative.Derivative` derivative and mints the provided amount of SHORT positions to a seller and LONG positions to a buyer
    /// @param _derivative LibDerivative.Derivative Derivative definition
    /// @param _amount uint256 Amount of positions to create
    /// @param _positionsOwners address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address
    function create(
        LibDerivative.Derivative calldata _derivative,
        uint256 _amount,
        address[2] calldata _positionsOwners
    ) external whenNotPaused nonReentrant {
        _create(_derivative, _amount, _positionsOwners);
    }

    /// @notice It can either 1) deploy AND mint 2) only mint.
    ///It checks whether the ERC20 contracts representing the LONG and SHORT positions of the provided `LibDerivative.Derivative`. If they have not been deployed yet, and it deploys the respective ERC20 contracts and mints the supplied _amount respectively to the provided buyer's and seller's accounts. If they have already been deployed, it only mints the provided _amount to the provided buyer's and seller's accounts.
    /// @param _derivative LibDerivative.Derivative Derivative definition
    /// @param _amount uint256 Amount of positions to create
    /// @param _positionsOwners address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address
    function createAndMint(
        LibDerivative.Derivative calldata _derivative,
        uint256 _amount,
        address[2] calldata _positionsOwners
    ) external whenNotPaused nonReentrant {
        bytes32 derivativeHash = _derivative.getDerivativeHash();
        address implementationAddress = protocolAddressesArgs.opiumProxyFactory.getImplementationAddress();
        (address longPositionTokenAddress, bool isLongDeployed) = derivativeHash.predictAndCheckDeterministicAddress(
            true,
            implementationAddress,
            address(protocolAddressesArgs.opiumProxyFactory)
        );
        (address shortPositionTokenAddress, bool isShortDeployed) = derivativeHash.predictAndCheckDeterministicAddress(
            false,
            implementationAddress,
            address(protocolAddressesArgs.opiumProxyFactory)
        );
        require(isLongDeployed == isShortDeployed);
        if (isLongDeployed) {
            _create(_derivative, _amount, _positionsOwners);
        } else {
            address[2] memory _positionsAddress = [longPositionTokenAddress, shortPositionTokenAddress];
            _mint(_amount, _positionsAddress, _positionsOwners);
        }
    }

    /// @notice This function mints the provided amount of LONG/SHORT positions to msg.sender for a previously deployed pair of LONG/SHORT ERC20 contracts
    /// @param _amount uint256 Amount of positions to create
    /// @param _positionAddresses address[2] Addresses of buyer and seller
    /// [0] - LONG erc20 position address
    /// [1] - SHORT erc20 position address
    /// @param _positionsOwners address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address
    function mint(
        uint256 _amount,
        address[2] calldata _positionAddresses,
        address[2] calldata _positionsOwners
    ) external whenNotPaused nonReentrant {
        _mint(_amount, _positionAddresses, _positionsOwners);
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
        require(_positionsAddresses.length == _amounts.length, "C1");
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
        require(_positionsAddresses.length == _amounts.length, "C1");
        for (uint256 i; i < _positionsAddresses.length; i++) {
            _execute(_positionsOwner, _positionsAddresses[i], _amounts[i]);
        }
    }

    /// @notice Redeems a single market neutral position pair
    /// @param _positionAddresses address[2] `_positionAddresses` of the positions that need to be redeemed
    /// @param _amount uint256 Amount of tokens to redeem
    function redeem(address[2] calldata _positionAddresses, uint256 _amount) external nonReentrant {
        _redeem(_positionAddresses, _amount);
    }

    /// @notice Redeems several market neutral position pairs
    /// @param _positionsAddresses address[2][] `_positionsAddresses` of the positions that need to be redeemed
    /// @param _amounts uint256[] Amount of tokens to redeem for each position pair
    function redeem(address[2][] calldata _positionsAddresses, uint256[] calldata _amounts) external nonReentrant {
        require(_positionsAddresses.length == _amounts.length, "C1");
        for (uint256 i = 0; i < _positionsAddresses.length; i++) {
            _redeem(_positionsAddresses[i], _amounts[i]);
        }
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `protocolParametersArgs.noDataCancellationPeriod`
    /// @param _positionAddress PositionType of positions to be canceled
    /// @param _amount uint256 Amount of positions to cancel
    function cancel(address _positionAddress, uint256 _amount) external nonReentrant {
        _cancel(_positionAddress, _amount);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `protocolParametersArgs.noDataCancellationPeriod`
    /// @param _positionsAddresses PositionTypes of positions to be canceled
    /// @param _amounts uint256[] Amount of positions to cancel for each `positionAddress`
    function cancel(address[] calldata _positionsAddresses, uint256[] calldata _amounts) external nonReentrant {
        require(_positionsAddresses.length == _amounts.length, "C1");
        for (uint256 i; i < _positionsAddresses.length; i++) {
            _cancel(_positionsAddresses[i], _amounts[i]);
        }
    }

    // ****************** PRIVATE FUNCTIONS ******************
    function _create(
        LibDerivative.Derivative calldata _derivative,
        uint256 _amount,
        address[2] calldata _positionsOwners
    ) private {
        // Generate hash for derivative
        bytes32 derivativeHash = _derivative.getDerivativeHash();

        // Check if ticker was canceled
        require(!cancelled[derivativeHash], "C7");

        // Validate input data against Derivative logic (`syntheticId`)
        require(IDerivativeLogic(_derivative.syntheticId).validateInput(_derivative), "C8");

        uint256[2] memory margins;
        // Get cached margin required according to logic from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = ISyntheticAggregator(protocolAddressesArgs.syntheticAggregator).getMargin(
            derivativeHash,
            _derivative
        );

        uint256 totalMargin = margins[0] + margins[1];
        require((totalMargin * _amount).modWithPrecisionFactor() == 0, "C5");
        uint256 totalMarginToE18 = totalMargin.mulWithPrecisionFactor(_amount);

        // Check ERC20 tokens allowance: (margins[0] + margins[1]) * amount
        // `msg.sender` must provide margin for position creation
        require(
            IERC20Upgradeable(_derivative.token).allowance(msg.sender, address(protocolAddressesArgs.tokenSpender)) >=
                totalMarginToE18,
            "C12"
        );

        // Take ERC20 tokens from msg.sender, should never revert in correct ERC20 implementation
        protocolAddressesArgs.tokenSpender.claimTokens(
            IERC20Upgradeable(_derivative.token),
            msg.sender,
            address(this),
            totalMarginToE18
        );

        // Increment p2p positions balance by collected margin: vault += (margins[0] + margins[1]) * _amount
        _increaseP2PVault(derivativeHash, totalMarginToE18);

        // Mint LONG and SHORT positions tokens
        protocolAddressesArgs.opiumProxyFactory.create(
            _positionsOwners[0],
            _positionsOwners[1],
            _amount,
            derivativeHash,
            _derivative
        );

        emit LogCreated(_positionsOwners[0], _positionsOwners[1], derivativeHash, _amount);
    }

    function _mint(
        uint256 _amount,
        address[2] memory _positionAddresses,
        address[2] memory _positionsOwners
    ) private {
        IOpiumPositionToken.OpiumPositionTokenParams memory longOpiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[0]
        ).getPositionTokenData();
        IOpiumPositionToken.OpiumPositionTokenParams memory shortOpiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[1]
        ).getPositionTokenData();
        _onlyOpiumFactoryTokens(_positionAddresses[0], longOpiumPositionTokenParams);
        _onlyOpiumFactoryTokens(_positionAddresses[1], shortOpiumPositionTokenParams);
        require(shortOpiumPositionTokenParams.derivativeHash == longOpiumPositionTokenParams.derivativeHash, "C2");
        require(longOpiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG, "C3");
        require(shortOpiumPositionTokenParams.positionType == LibDerivative.PositionType.SHORT, "C3");

        // Check if ticker was canceled
        require(!cancelled[longOpiumPositionTokenParams.derivativeHash], "C7");

        uint256[2] memory margins;
        // Get cached margin required according to logic from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = ISyntheticAggregator(protocolAddressesArgs.syntheticAggregator).getMargin(
            longOpiumPositionTokenParams.derivativeHash,
            longOpiumPositionTokenParams.derivative
        );

        uint256 totalMargin = margins[0] + margins[1];
        require((totalMargin * _amount).modWithPrecisionFactor() == 0, "C5");
        uint256 totalMarginToE18 = totalMargin.mulWithPrecisionFactor(_amount);

        // Check ERC20 tokens allowance: (margins[0] + margins[1]) * amount
        // `msg.sender` must provide margin for position creation
        require(
            IERC20Upgradeable(longOpiumPositionTokenParams.derivative.token).allowance(
                msg.sender,
                address(protocolAddressesArgs.tokenSpender)
            ) >= totalMarginToE18,
            "C12"
        );

        // Take ERC20 tokens from msg.sender, should never revert in correct ERC20 implementation
        protocolAddressesArgs.tokenSpender.claimTokens(
            IERC20Upgradeable(longOpiumPositionTokenParams.derivative.token),
            msg.sender,
            address(this),
            totalMarginToE18
        );

        // Mint LONG and SHORT positions tokens
        protocolAddressesArgs.opiumProxyFactory.mintPair(
            _positionsOwners[0],
            _positionsOwners[1],
            _positionAddresses[0],
            _positionAddresses[1],
            _amount
        );

        // Increment p2p positions balance by collected margin: vault += (margins[0] + margins[1]) * _amount
        _increaseP2PVault(longOpiumPositionTokenParams.derivativeHash, totalMarginToE18);

        emit LogMinted(_positionsOwners[0], _positionsOwners[1], longOpiumPositionTokenParams.derivativeHash, _amount);
    }

    /// @notice Redeems market neutral position for a `_positionAddresses` pair
    /// @param _positionAddresses address[2] `positionAddresses` of the position that needs to be burnt
    /// [0] LONG position
    /// [1] SHORT position
    /// @param _amount uint256 amount of the positions to be redeemed
    function _redeem(address[2] memory _positionAddresses, uint256 _amount) private whenNotPaused {
        uint256 longBalance = IERC20Upgradeable(_positionAddresses[0]).balanceOf(msg.sender);
        uint256 shortBalance = IERC20Upgradeable(_positionAddresses[1]).balanceOf(msg.sender);
        IOpiumPositionToken.OpiumPositionTokenParams memory longOpiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[0]
        ).getPositionTokenData();
        IOpiumPositionToken.OpiumPositionTokenParams memory shortOpiumPositionTokenParams = IOpiumPositionToken(
            _positionAddresses[1]
        ).getPositionTokenData();
        _onlyOpiumFactoryTokens(_positionAddresses[0], longOpiumPositionTokenParams);
        _onlyOpiumFactoryTokens(_positionAddresses[1], shortOpiumPositionTokenParams);
        require(shortOpiumPositionTokenParams.derivativeHash == longOpiumPositionTokenParams.derivativeHash, "C2");
        require(shortOpiumPositionTokenParams.positionType == LibDerivative.PositionType.SHORT, "C3");
        require(longOpiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG, "C3");

        ISyntheticAggregator.SyntheticCache memory syntheticCache = protocolAddressesArgs
            .syntheticAggregator
            .getSyntheticCache(shortOpiumPositionTokenParams.derivativeHash, shortOpiumPositionTokenParams.derivative);

        uint256 totalMargin = (syntheticCache.buyerMargin + syntheticCache.sellerMargin).mulWithPrecisionFactor(
            _amount
        );
        uint256 fees = _getFees(
            syntheticCache.authorAddress,
            shortOpiumPositionTokenParams.derivative.token,
            protocolAddressesArgs.protocolRedemptionFeeReceiver,
            syntheticCache.authorCommission,
            protocolParametersArgs.protocolRedemptionFeeCommissionBase,
            totalMargin
        );

        protocolAddressesArgs.opiumProxyFactory.burnPair(
            msg.sender,
            _positionAddresses[0],
            _positionAddresses[1],
            _amount
        );

        _decreaseP2PVault(shortOpiumPositionTokenParams.derivativeHash, totalMargin);
        IERC20Upgradeable(shortOpiumPositionTokenParams.derivative.token).safeTransfer(msg.sender, totalMargin - fees);

        emit LogRedeem(msg.sender, shortOpiumPositionTokenParams.derivativeHash, _amount);
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
        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddress
        ).getPositionTokenData();
        _onlyOpiumFactoryTokens(_positionAddress, opiumPositionTokenParams);
        // Check if ticker was canceled
        require(!cancelled[opiumPositionTokenParams.derivativeHash], "C7");
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

        _decreaseP2PVault(opiumPositionTokenParams.derivativeHash, payout);
        emit LogExecuted(_positionOwner, _positionAddress, _amount);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `protocolParametersArgs.noDataCancellationPeriod`
    /// @param _positionAddress PositionTypes of positions to be canceled
    /// @param _amount uint256[] Amount of positions to cancel for each `positionAddress`
    function _cancel(address _positionAddress, uint256 _amount) private whenNotPaused {
        IOpiumPositionToken.OpiumPositionTokenParams memory opiumPositionTokenParams = IOpiumPositionToken(
            _positionAddress
        ).getPositionTokenData();
        _onlyOpiumFactoryTokens(_positionAddress, opiumPositionTokenParams);

        // It's sufficient to perform all the sanity checks only if a derivative has not yet been canceled
        if (!cancelled[opiumPositionTokenParams.derivativeHash]) {
            // Don't allow to cancel tickers with "dummy" oracleIds
            require(opiumPositionTokenParams.derivative.oracleId != address(0), "C6");

            // Check if cancellation is called after `protocolParametersArgs.noDataCancellationPeriod` and `oracleId` didn't provided data
            require(
                opiumPositionTokenParams.derivative.endTime + protocolParametersArgs.noDataCancellationPeriod <=
                    block.timestamp,
                "C13"
            );
            // Ensures that `Opium.OracleAggregator` has still not been provided with data after noDataCancellationperiod
            // The check needs to be performed only the first time a derivative is being canceled as to avoid preventing other parties from canceling their positions in case `Opium.OracleAggregator` receives data after the successful cancelation
            require(
                !protocolAddressesArgs.oracleAggregator.hasData(
                    opiumPositionTokenParams.derivative.oracleId,
                    opiumPositionTokenParams.derivative.endTime
                ),
                "C13"
            );
            cancelled[opiumPositionTokenParams.derivativeHash] = true;
            // Emit `LogDerivativeHashCancelled` event only once and mark ticker as canceled
            emit LogDerivativeHashCancelled(msg.sender, opiumPositionTokenParams.derivativeHash);
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
            payout = margins[0].mulWithPrecisionFactor(_amount);

            // Check if `positionAddress` is a SHORT position
        } else {
            // Set payout to sellerPayout
            payout = margins[1].mulWithPrecisionFactor(_amount);
        }

        // Burn canceled position tokens
        protocolAddressesArgs.opiumProxyFactory.burn(msg.sender, _positionAddress, _amount);

        // Transfer payout * _amounts[i]
        if (payout > 0) {
            IERC20Upgradeable(opiumPositionTokenParams.derivative.token).safeTransfer(msg.sender, payout);
        }

        _decreaseP2PVault(opiumPositionTokenParams.derivativeHash, payout);
        emit LogPositionCancelled(msg.sender, opiumPositionTokenParams.derivativeHash);
    }

    function _getPayout(
        IOpiumPositionToken.OpiumPositionTokenParams memory _opiumPositionTokenParams,
        uint256 _amount,
        ISyntheticAggregator _syntheticAggregator,
        IOracleAggregator _oracleAggregator
    ) private returns (uint256 payout) {
        /// if the derivativePayout for both the buyer and the seller are 0 it means that it's the first time the _getPayout function is being executed, hence it will fetch the fetch the payouts from the syntheticId and cache them.
        if (
            derivativePayouts[_opiumPositionTokenParams.derivativeHash][0] == 0 &&
            derivativePayouts[_opiumPositionTokenParams.derivativeHash][1] == 0
        ) {
            /// fetches the derivative's data from the related oracleId
            /// opium allows the usage of "dummy" oracleIds - oracleIds whose address is the null address - in which case the data is set to 0
            uint256 data = _opiumPositionTokenParams.derivative.oracleId == address(0)
                ? 0
                : _oracleAggregator.getData(
                    _opiumPositionTokenParams.derivative.oracleId,
                    _opiumPositionTokenParams.derivative.endTime
                );
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

        uint256 positionMargin;

        // Check if `_positionType` is LONG
        if (_opiumPositionTokenParams.positionType == LibDerivative.PositionType.LONG) {
            // Calculates buyerPayout from ratio = (buyerMargin + sellerMargin) * buyerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
            // Set payout to buyerPayout multiplied by amount
            payout = (((syntheticCache.buyerMargin + syntheticCache.sellerMargin) * buyerPayoutRatio) /
                (buyerPayoutRatio + sellerPayoutRatio)).mulWithPrecisionFactor(_amount);
            // sets positionMargin to buyerMargin * amount
            positionMargin = syntheticCache.buyerMargin.mulWithPrecisionFactor(_amount);
            // Check if `_positionType` is a SHORT position
        } else {
            // Calculates sellerPayout from ratio = sellerPayout = (buyerMargin + sellerMargin) * sellerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
            // Set payout to sellerPayout multiplied by amount
            payout = (((syntheticCache.buyerMargin + syntheticCache.sellerMargin) * sellerPayoutRatio) /
                (buyerPayoutRatio + sellerPayoutRatio)).mulWithPrecisionFactor(_amount);
            // sets positionMargin to sellerMargin * amount
            positionMargin = syntheticCache.sellerMargin.mulWithPrecisionFactor(_amount);
        }

        // Take fees only from profit makers
        // Check: payout > positionMargin * amount
        if (payout > positionMargin) {
            // Get Opium and `syntheticId` author fees and subtract it from payout
            payout =
                payout -
                (
                    _getFees(
                        syntheticCache.authorAddress,
                        _opiumPositionTokenParams.derivative.token,
                        protocolAddressesArgs.protocolExecutionFeeReceiver,
                        syntheticCache.authorCommission,
                        protocolParametersArgs.protocolExecutionFeeCommissionBase,
                        payout - positionMargin
                    )
                );
        }
    }

    /// @notice Calculates `syntheticId` author and opium fees from profit makers
    /// @param _profit uint256 payout of one position
    /// @return fee uint256 Opium and `syntheticId` author fee
    function _getFees(
        address _authorAddress,
        address _tokenAddress,
        address _protocolFeeReceiver,
        uint256 _authorCommission,
        uint256 _protocolBaseCommission,
        uint256 _profit
    ) private returns (uint256 fee) {
        // Calculate fee
        // fee = profit * commission / COMMISSION_BASE
        fee = (_profit * _authorCommission) / protocolParametersArgs.derivativeAuthorCommissionBase;
        // If commission is zero, finish
        if (fee == 0) {
            return 0;
        }

        // Calculate opium fee
        // opiumFee = fee * OPIUM_COMMISSION_PART / OPIUM_COMMISSION_BASE
        uint256 opiumFee = (fee * protocolParametersArgs.protocolCommissionPart) / _protocolBaseCommission;

        // Calculate author fee
        // authorFee = fee - opiumFee
        uint256 authorFee = fee - opiumFee;

        // Update feeVault for Opium team
        // feesVault[protocolFeeReceiver][token] += protocolFee
        feesVaults[_protocolFeeReceiver][_tokenAddress] += opiumFee;

        // Update feeVault for `syntheticId` author
        // feeVault[author][token] += authorFee
        feesVaults[_authorAddress][_tokenAddress] += authorFee;
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
        require(_tokenAddress == predicted, "C14");
    }

    function _increaseP2PVault(bytes32 _derivativeHash, uint256 _amount) private {
        p2pVaults[_derivativeHash] += _amount;
    }

    function _decreaseP2PVault(bytes32 _derivativeHash, uint256 _amount) private {
        require(p2pVaults[_derivativeHash] >= _amount, "C9");
        p2pVaults[_derivativeHash] -= _amount;
    }
}
