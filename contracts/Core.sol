pragma solidity 0.8.5;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Interface/IDerivativeLogic.sol";

import "./Errors/CoreErrors.sol";

import "./Lib/UsingRegistry.sol";
import "./Lib/LibDerivative.sol";
import "./Lib/LibCommission.sol";
import "./Lib/LibPosition.sol";

import "./Registry.sol";
import "./OpiumProxyFactory.sol";

import "./OracleAggregator.sol";
import "./SyntheticAggregator.sol";
import "./TokenSpender.sol";

/// @title Opium.Core contract creates positions, holds and distributes margin at the maturity
contract Core is LibDerivative, LibCommission, UsingRegistry, CoreErrors, ReentrancyGuardUpgradeable {
    using SafeMath for uint256;
    using LibPosition for bytes32;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    enum PositionType {
        SHORT,
        LONG
    }

    // Emitted when Core creates new position
    event Created(address buyer, address seller, bytes32 derivativeHash, uint256 amount);
    // Emitted when Core executes positions
    event Executed(address tokenOwner, address positionAddress, uint256 amount);
    // Emitted when Core cancels ticker for the first time
    event Canceled(bytes32 derivativeHash);
    // Emitted when Core redeems an amount of market neutral positions
    event LogRedeem(uint256 amount, bytes32 derivativeHash);

    // Period of time after which ticker could be canceled if no data was provided to the `oracleId`
    uint256 public constant NO_DATA_CANCELLATION_PERIOD = 2 weeks;

    // Vaults for pools
    // This mapping holds balances of pooled positions
    // poolVaults[syntheticAddress][tokenAddress] => availableBalance
    mapping(address => mapping(address => uint256)) public poolVaults;

    // Vaults for fees
    // This mapping holds balances of fee recipients
    // feesVaults[feeRecipientAddress][tokenAddress] => availableBalance
    mapping(address => mapping(address => uint256)) public feesVaults;

    // Hashes of cancelled tickers
    mapping(bytes32 => bool) public cancelled;

    /// @notice Calls Core.Lib.UsingRegistry constructor
    function initialize(address _registry) public initializer {
        __UsingRegistry__init__(_registry);
    }

    // PUBLIC FUNCTIONS

    /// @notice This function allows fee recipients to withdraw their fees
    /// @param _tokenAddress address Address of an ERC20 token to withdraw
    function withdrawFee(address _tokenAddress) public nonReentrant {
        uint256 balance = feesVaults[msg.sender][_tokenAddress];
        feesVaults[msg.sender][_tokenAddress] = 0;
        IERC20Upgradeable(_tokenAddress).safeTransfer(msg.sender, balance);
    }

    /// @notice Creates derivative contracts (positions)
    /// @param _derivative Derivative Derivative definition
    /// @param _amount uint256 Amount of derivatives to be created
    /// @param _addresses address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address - if seller is set to `address(0)`, consider as pooled position
    function create(
        Derivative memory _derivative,
        uint256 _amount,
        address[2] memory _addresses
    ) public nonReentrant {
        _create(_derivative, _amount, _addresses);
    }

    /// @notice Executes several positions of `msg.sender` with specified `positionAddress`
    /// @param _positionType address `positionAddress` of position that needs to be executed
    /// @param _amount uint256 Amount of positions to execute
    /// @param _derivative Derivative Derivative definition
    function execute(
        PositionType _positionType,
        uint256 _amount,
        Derivative memory _derivative
    ) public nonReentrant {
        PositionType[] memory positionTypes = new PositionType[](1);
        uint256[] memory amounts = new uint256[](1);
        Derivative[] memory derivatives = new Derivative[](1);

        positionTypes[0] = _positionType;
        amounts[0] = _amount;
        derivatives[0] = _derivative;

        _execute(msg.sender, positionTypes, amounts, derivatives);
    }

    /// @notice Executes several positions of `_tokenOwner` with specified `positionAddress`
    /// @param _tokenOwner address Address of the owner of positions
    /// @param _positionType address `positionAddress` of positions that needs to be executed
    /// @param _amount uint256 Amount of positions to execute
    /// @param _derivative Derivative Derivative definition
    function execute(
        address _tokenOwner,
        PositionType _positionType,
        uint256 _amount,
        Derivative memory _derivative
    ) public nonReentrant {
        PositionType[] memory positionTypes = new PositionType[](1);
        uint256[] memory amounts = new uint256[](1);
        Derivative[] memory derivatives = new Derivative[](1);

        positionTypes[0] = _positionType;
        amounts[0] = _amount;
        derivatives[0] = _derivative;

        _execute(_tokenOwner, positionTypes, amounts, derivatives);
    }

    /// @notice Executes several positions of `msg.sender` with different `positionAddresses`
    /// @param _positionTypes address[] `positionAddresses` of positions that needs to be executed
    /// @param _amounts uint256[] Amount of positions to execute for each `positionAddress`
    /// @param _derivatives Derivative[] Derivative definitions for each `positionAddress`
    function execute(
        PositionType[] memory _positionTypes,
        uint256[] memory _amounts,
        Derivative[] memory _derivatives
    ) public nonReentrant {
        _execute(msg.sender, _positionTypes, _amounts, _derivatives);
    }

    /// @notice Executes several positions of `_tokenOwner` with different `positionAddresses`
    /// @param _tokenOwner address Address of the owner of positions
    /// @param _positionTypes address[] `positionAddresses` of positions that needs to be executed
    /// @param _amounts uint256[] Amount of positions to execute for each `positionAddresses`
    /// @param _derivatives Derivative[] Derivative definitions for each `positionAddress`
    /// execute many addresses
    function execute(
        address _tokenOwner,
        PositionType[] calldata _positionTypes,
        uint256[] calldata _amounts,
        Derivative[] calldata _derivatives
    ) external nonReentrant {
        _execute(_tokenOwner, _positionTypes, _amounts, _derivatives);
    }

    /// @notice Burns market neutral position for a list of `_positionsAddresses` pairs
    /// @param _positionsAddresses address[2][] `_positionsAddresses` of the positions that need to be burnt
    /// @param _derivatives Derivative[] derivative definitions for each `positionAddresses` pair
    function redeem(
        address[2][] calldata _positionsAddresses,
        Derivative[] calldata _derivatives,
        uint256[] calldata _amount
    ) external nonReentrant {
        require(_positionsAddresses.length == _derivatives.length, "POSITIONS_DERIVATIVES_MISMATCH");
        for (uint24 i = 0; i < _positionsAddresses.length; i++) {
            _redeem(msg.sender, _positionsAddresses[i], _derivatives[i], _amount[i]);
        }
    }

    /// @notice Burns market neutral position for a `_positionsAddresses` pair
    /// @param _positionAddresses address[2] `_positionAddresses` of the position that needs to be burnt
    /// @param _derivative Derivative derivative definition for the `positionAddresses` pair
    function redeem(
        address[2] calldata _positionAddresses,
        Derivative calldata _derivative,
        uint256 _amount
    ) external nonReentrant {
        _redeem(msg.sender, _positionAddresses, _derivative, _amount);
    }

    /// @notice Burns market neutral position for a `_positionAddresses` pair
    /// @param _positionsOwner address `positionsOwner` owner of the `positionAddresses` pair
    /// @param _positionAddresses address[2] `positionAddresses` of the position that needs to be burnt
    /// @param _derivative Derivative derivative definition for the `positionAddresses` pair
    function _redeem(
        address _positionsOwner,
        address[2] memory _positionAddresses,
        Derivative memory _derivative,
        uint256 _amount
    ) private {
        uint256 shortBalance = IERC20Upgradeable(_positionAddresses[0]).balanceOf(_positionsOwner);
        uint256 longBalance = IERC20Upgradeable(_positionAddresses[1]).balanceOf(_positionsOwner);
        require(shortBalance >= _amount, "NOT_ENOUGH_SHORT_POSITIONS");
        require(longBalance >= _amount, "NOT_ENOUGH_LONG_POSITIONS");

        bytes32 derivativeHash = getDerivativeHash(_derivative);
        ExecuteAndCancelLocalVars memory vars;
        vars.opiumProxyFactory = OpiumProxyFactory(registry.getOpiumProxyFactory());
        vars.syntheticAggregator = SyntheticAggregator(registry.getSyntheticAggregator());

        require(
            derivativeHash.computeShortPositionAddress(address(vars.opiumProxyFactory)) == _positionAddresses[0],
            "WRONG_SHORT"
        );
        require(
            derivativeHash.computeLongPositionAddress(address(vars.opiumProxyFactory)) == _positionAddresses[1],
            "WRONG_LONG"
        );

        vars.opiumProxyFactory.burn(_positionsOwner, _positionAddresses[0], _amount);
        vars.opiumProxyFactory.burn(_positionsOwner, _positionAddresses[1], _amount);

        uint256[2] memory margins;
        (margins[0], margins[1]) = vars.syntheticAggregator.getMargin(derivativeHash, _derivative);
        uint256 totalMargin = margins[0].add(margins[1]).mul(_amount);
        uint256 fees = _getFees(vars.syntheticAggregator, derivativeHash, _derivative, totalMargin);

        IERC20Upgradeable(_derivative.token).safeTransfer(_positionsOwner, totalMargin.sub(fees));
        emit LogRedeem(_amount, derivativeHash);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionType PositionType of positions to be canceled
    /// @param _amount uint256 Amount of positions to cancel
    /// @param _derivative Derivative Derivative definition
    function cancel(
        PositionType _positionType,
        uint256 _amount,
        Derivative memory _derivative
    ) public nonReentrant {
        PositionType[] memory positionTypes = new PositionType[](1);
        uint256[] memory amounts = new uint256[](1);
        Derivative[] memory derivatives = new Derivative[](1);

        positionTypes[0] = _positionType;
        amounts[0] = _amount;
        derivatives[0] = _derivative;

        _cancel(positionTypes, amounts, derivatives);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionTypes PositionTypes of positions to be canceled
    /// @param _amounts uint256[] Amount of positions to cancel for each `positionAddress`
    /// @param _derivatives Derivative[] Derivative definitions for each `_positionAddress`
    function cancel(
        PositionType[] memory _positionTypes,
        uint256[] memory _amounts,
        Derivative[] memory _derivatives
    ) public nonReentrant {
        _cancel(_positionTypes, _amounts, _derivatives);
    }

    // PRIVATE FUNCTIONS

    struct CreatePooledLocalVars {
        SyntheticAggregator syntheticAggregator;
        IDerivativeLogic derivativeLogic;
        IERC20Upgradeable marginToken;
        TokenSpender tokenSpender;
        OpiumProxyFactory opiumProxyFactory;
    }

    struct CreateLocalVars {
        SyntheticAggregator syntheticAggregator;
        IDerivativeLogic derivativeLogic;
        IERC20Upgradeable marginToken;
        TokenSpender tokenSpender;
        OpiumProxyFactory opiumProxyFactory;
    }

    /// @notice This function creates p2p positions
    /// @param _derivative Derivative Derivative definition
    /// @param _amount uint256 Amount of positions to create
    /// @param _addresses address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address
    function _create(
        Derivative memory _derivative,
        uint256 _amount,
        address[2] memory _addresses
    ) private {
        // Local variables
        CreateLocalVars memory vars;

        // Create instance of Opium.SyntheticAggregator
        // Create instance of Opium.IDerivativeLogic
        // Create instance of margin token
        // Create instance of Opium.TokenSpender
        // Create instance of Opium.OpiumProxyFactory
        vars.syntheticAggregator = SyntheticAggregator(registry.getSyntheticAggregator());
        vars.derivativeLogic = IDerivativeLogic(_derivative.syntheticId);
        vars.marginToken = IERC20Upgradeable(_derivative.token);
        vars.tokenSpender = TokenSpender(registry.getTokenSpender());
        vars.opiumProxyFactory = OpiumProxyFactory(registry.getOpiumProxyFactory());

        // Generate hash for derivative
        bytes32 derivativeHash = getDerivativeHash(_derivative);

        // Check with Opium.SyntheticAggregator if syntheticId is not a pool
        require(!vars.syntheticAggregator.isPool(derivativeHash, _derivative), ERROR_CORE_CANT_BE_POOL);

        // Check if ticker was canceled
        require(!cancelled[derivativeHash], ERROR_CORE_TICKER_WAS_CANCELLED);

        // Validate input data against Derivative logic (`syntheticId`)
        require(vars.derivativeLogic.validateInput(_derivative), ERROR_CORE_SYNTHETIC_VALIDATION_ERROR);

        uint256[2] memory margins;
        // Get cached margin required according to logic from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = vars.syntheticAggregator.getMargin(derivativeHash, _derivative);

        // Check ERC20 tokens allowance: (margins[0] + margins[1]) * amount
        // `msg.sender` must provide margin for position creation
        require(
            vars.marginToken.allowance(msg.sender, address(vars.tokenSpender)) >=
                margins[0].add(margins[1]).mul(_amount),
            ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE
        );

        // Take ERC20 tokens from msg.sender, should never revert in correct ERC20 implementation
        vars.tokenSpender.claimTokens(
            vars.marginToken,
            msg.sender,
            address(this),
            margins[0].add(margins[1]).mul(_amount)
        );

        // Mint LONG and SHORT positions tokens
        vars.opiumProxyFactory.mint(_addresses[0], _addresses[1], derivativeHash, _amount);

        emit Created(_addresses[0], _addresses[1], derivativeHash, _amount);
    }

    struct ExecuteAndCancelLocalVars {
        OpiumProxyFactory opiumProxyFactory;
        OracleAggregator oracleAggregator;
        SyntheticAggregator syntheticAggregator;
    }

    /// @notice Executes several positions of `_tokenOwner` with different `positionAddresses`
    /// @param _tokenOwner address Address of the owner of positions
    /// @param _positionType address[] `positionAddresses` of positions that needs to be executed
    /// @param _amounts uint256[] Amount of positions to execute for each `positionAddress`
    /// @param _derivatives Derivative[] Derivative definitions for each `positionAddress`
    function _execute(
        address _tokenOwner,
        PositionType[] memory _positionType,
        uint256[] memory _amounts,
        Derivative[] memory _derivatives
    ) private {
        require(_positionType.length == _amounts.length, ERROR_CORE_ADDRESSES_AND_AMOUNTS_LENGTH_DO_NOT_MATCH);
        require(
            _positionType.length == _derivatives.length,
            ERROR_CORE_ADDRESSES_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH
        );

        // Local variables
        ExecuteAndCancelLocalVars memory vars;

        // Create instance of Opium.OpiumProxyFactory
        // Create instance of Opium.OracleAggregator
        // Create instance of Opium.SyntheticAggregator
        vars.opiumProxyFactory = OpiumProxyFactory(registry.getOpiumProxyFactory());
        vars.oracleAggregator = OracleAggregator(registry.getOracleAggregator());
        vars.syntheticAggregator = SyntheticAggregator(registry.getSyntheticAggregator());

        for (uint256 i; i < _derivatives.length; i++) {
            // Check if execution is performed after endTime
            require(block.timestamp > _derivatives[i].endTime, ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED);
            bytes32 derivativeHash = getDerivativeHash(_derivatives[i]);

            address positionAddress = _positionType[i] == PositionType.LONG
                ? derivativeHash.computeLongPositionAddress(address(vars.opiumProxyFactory))
                : derivativeHash.computeShortPositionAddress(address(vars.opiumProxyFactory));

            // Checking whether execution is performed by `_tokenOwner` or `_tokenOwner` allowed third party executions on it's behalf
            require(
                _tokenOwner == msg.sender ||
                    IDerivativeLogic(_derivatives[i].syntheticId).thirdpartyExecutionAllowed(_tokenOwner),
                ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED
            );

            // Returns payout for all positions
            uint256 payout = _getPayout(_derivatives[i], _positionType[i], _amounts[i], vars);

            // Transfer payout
            if (payout > 0) {
                IERC20Upgradeable(_derivatives[i].token).safeTransfer(_tokenOwner, payout);
            }

            // Burn executed position tokens
            vars.opiumProxyFactory.burn(_tokenOwner, positionAddress, _amounts[i]);

            emit Executed(_tokenOwner, positionAddress, _amounts[i]);
        }
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionTypes PositionTypes of positions to be canceled
    /// @param _amounts uint256[] Amount of positions to cancel for each `positionAddress`
    /// @param _derivatives Derivative[] Derivative definitions for each `positionAddress`
    function _cancel(
        PositionType[] memory _positionTypes,
        uint256[] memory _amounts,
        Derivative[] memory _derivatives
    ) private {
        require(_positionTypes.length == _amounts.length, ERROR_CORE_ADDRESSES_AND_AMOUNTS_LENGTH_DO_NOT_MATCH);
        require(
            _positionTypes.length == _derivatives.length,
            ERROR_CORE_ADDRESSES_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH
        );

        // Local variables
        ExecuteAndCancelLocalVars memory vars;

        // Create instance of Opium.OpiumProxyFactory
        // Create instance of Opium.OracleAggregator
        // Create instance of Opium.SyntheticAggregator
        vars.opiumProxyFactory = OpiumProxyFactory(registry.getOpiumProxyFactory());
        vars.oracleAggregator = OracleAggregator(registry.getOracleAggregator());
        vars.syntheticAggregator = SyntheticAggregator(registry.getSyntheticAggregator());

        for (uint256 i; i < _positionTypes.length; i++) {
            // Don't allow to cancel tickers with "dummy" oracleIds
            require(_derivatives[i].oracleId != address(0), ERROR_CORE_CANT_CANCEL_DUMMY_ORACLE_ID);

            // Check if cancellation is called after `NO_DATA_CANCELLATION_PERIOD` and `oracleId` didn't provided data
            require(
                _derivatives[i].endTime + NO_DATA_CANCELLATION_PERIOD <= block.timestamp &&
                    !vars.oracleAggregator.hasData(_derivatives[i].oracleId, _derivatives[i].endTime),
                ERROR_CORE_CANCELLATION_IS_NOT_ALLOWED
            );

            // Generate hash for derivative
            bytes32 derivativeHash = getDerivativeHash(_derivatives[i]);

            address positionAddress = _positionTypes[i] == PositionType.LONG
                ? derivativeHash.computeLongPositionAddress(address(vars.opiumProxyFactory))
                : derivativeHash.computeShortPositionAddress(address(vars.opiumProxyFactory));

            // Emit `Canceled` event only once and mark ticker as canceled
            if (!cancelled[derivativeHash]) {
                cancelled[derivativeHash] = true;
                emit Canceled(derivativeHash);
            }

            uint256[2] memory margins;
            // Get cached margin required according to logic from Opium.SyntheticAggregator
            // margins[0] - buyerMargin
            // margins[1] - sellerMargin
            (margins[0], margins[1]) = vars.syntheticAggregator.getMargin(derivativeHash, _derivatives[i]);

            uint256 payout;
            // Check if `_positionAddresses` is a LONG position
            if (_positionTypes[i] == PositionType.LONG) {
                // Set payout to buyerPayout
                payout = margins[0];

                // Check if `positionAddress` is a SHORT position
            } else {
                // Set payout to sellerPayout
                payout = margins[1];
            }

            // Transfer payout * _amounts[i]
            if (payout > 0) {
                IERC20Upgradeable(_derivatives[i].token).safeTransfer(msg.sender, payout.mul(_amounts[i]));
            }

            // Burn canceled position tokens
            vars.opiumProxyFactory.burn(msg.sender, positionAddress, _amounts[i]);
        }
    }

    /// @notice Calculates payout for position and gets fees
    /// @param _derivative Derivative Derivative definition
    /// @param _positionType address `positionAddress` of positions
    /// @param _amount uint256 Amount of positions
    /// @param _vars ExecuteAndCancelLocalVars Helping local variables
    /// @return payout uint256 Payout for all tokens
    function _getPayout(
        Derivative memory _derivative,
        PositionType _positionType,
        uint256 _amount,
        ExecuteAndCancelLocalVars memory _vars
    ) private returns (uint256 payout) {
        // Trying to getData from Opium.OracleAggregator, could be reverted
        // Opium allows to use "dummy" oracleIds, in this case data is set to `0`
        uint256 data;
        if (_derivative.oracleId != address(0)) {
            data = _vars.oracleAggregator.getData(_derivative.oracleId, _derivative.endTime);
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

        // Generate hash for derivative
        bytes32 derivativeHash = getDerivativeHash(_derivative);

        // Check if ticker was canceled
        require(!cancelled[derivativeHash], ERROR_CORE_TICKER_WAS_CANCELLED);

        uint256[2] memory margins;
        // Get cached total margin required from Opium.SyntheticAggregator
        // margins[0] - buyerMargin
        // margins[1] - sellerMargin
        (margins[0], margins[1]) = _vars.syntheticAggregator.getMargin(derivativeHash, _derivative);

        uint256[2] memory payouts;
        // Calculate payouts from ratio
        // payouts[0] -> buyerPayout = (buyerMargin + sellerMargin) * buyerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
        // payouts[1] -> sellerPayout = (buyerMargin + sellerMargin) * sellerPayoutRatio / (buyerPayoutRatio + sellerPayoutRatio)
        payouts[0] = margins[0].add(margins[1]).mul(payoutRatio[0]).div(payoutRatio[0].add(payoutRatio[1]));
        payouts[1] = margins[0].add(margins[1]).mul(payoutRatio[1]).div(payoutRatio[0].add(payoutRatio[1]));

        // Check if `_positionType` is LONG
        if (_positionType == PositionType.LONG) {
            // Check if it's a pooled position
            if (_vars.syntheticAggregator.isPool(derivativeHash, _derivative)) {
                // Pooled position payoutRatio is considered as full payout, not as payoutRatio
                payout = payoutRatio[0];

                // Multiply payout by amount
                payout = payout.mul(_amount);

                // Check sufficiency of syntheticId balance in poolVaults
                require(
                    poolVaults[_derivative.syntheticId][_derivative.token] >= payout,
                    ERROR_CORE_INSUFFICIENT_POOL_BALANCE
                );

                // Subtract paid out margin from poolVault
                poolVaults[_derivative.syntheticId][_derivative.token] = poolVaults[_derivative.syntheticId][
                    _derivative.token
                ].sub(payout);
            } else {
                // Set payout to buyerPayout
                payout = payouts[0];

                // Multiply payout by amount
                payout = payout.mul(_amount);
            }

            // Take fees only from profit makers
            // Check: payout > buyerMargin * amount
            if (payout > margins[0].mul(_amount)) {
                // Get Opium and `syntheticId` author fees and subtract it from payout
                payout = payout.sub(
                    _getFees(_vars.syntheticAggregator, derivativeHash, _derivative, payout - margins[0].mul(_amount))
                );
            }

            // Check if `_positionType` is a SHORT position
        } else {
            // Set payout to sellerPayout
            payout = payouts[1];

            // Multiply payout by amount
            payout = payout.mul(_amount);

            // Take fees only from profit makers
            // Check: payout > sellerMargin * amount
            if (payout > margins[1].mul(_amount)) {
                // Get Opium fees and subtract it from payout
                payout = payout.sub(
                    _getFees(_vars.syntheticAggregator, derivativeHash, _derivative, payout - margins[1].mul(_amount))
                );
            }
        }
    }

    /// @notice Calculates `syntheticId` author and opium fees from profit makers
    /// @param _syntheticAggregator SyntheticAggregator Instance of Opium.SyntheticAggregator
    /// @param _derivativeHash bytes32 Derivative hash
    /// @param _derivative Derivative Derivative definition
    /// @param _profit uint256 payout of one position
    /// @return fee uint256 Opium and `syntheticId` author fee
    function _getFees(
        SyntheticAggregator _syntheticAggregator,
        bytes32 _derivativeHash,
        Derivative memory _derivative,
        uint256 _profit
    ) private returns (uint256 fee) {
        // Get cached `syntheticId` author address from Opium.SyntheticAggregator
        address authorAddress = _syntheticAggregator.getAuthorAddress(_derivativeHash, _derivative);
        // Get cached `syntheticId` fee percentage from Opium.SyntheticAggregator
        uint256 commission = _syntheticAggregator.getAuthorCommission(_derivativeHash, _derivative);

        // Calculate fee
        // fee = profit * commission / COMMISSION_BASE
        fee = _profit.mul(commission).div(COMMISSION_BASE);

        // If commission is zero, finish
        if (fee == 0) {
            return 0;
        }

        // Calculate opium fee
        // opiumFee = fee * OPIUM_COMMISSION_PART / OPIUM_COMMISSION_BASE
        uint256 opiumFee = fee.mul(OPIUM_COMMISSION_PART).div(OPIUM_COMMISSION_BASE);

        // Calculate author fee
        // authorFee = fee - opiumFee
        uint256 authorFee = fee.sub(opiumFee);

        // Get opium address
        address opiumAddress = registry.getOpiumAddress();

        // Update feeVault for Opium team
        // feesVault[opium][token] += opiumFee
        feesVaults[opiumAddress][_derivative.token] = feesVaults[opiumAddress][_derivative.token].add(opiumFee);

        // Update feeVault for `syntheticId` author
        // feeVault[author][token] += authorFee
        feesVaults[authorAddress][_derivative.token] = feesVaults[authorAddress][_derivative.token].add(authorFee);
    }
}
