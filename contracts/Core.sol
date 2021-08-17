pragma solidity 0.8.5;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

import "./Interface/IDerivativeLogic.sol";

import "./Errors/CoreErrors.sol";

import "./Lib/UsingRegistry.sol";
import "./Lib/LibDerivative.sol";
import "./Lib/LibCommission.sol";
import "./Lib/NewLibPosition.sol";

import "./Registry.sol";
import "./OpiumProxyFactory.sol";

import "./OracleAggregator.sol";
import "./SyntheticAggregator.sol";
import "./TokenSpender.sol";

/// @title Opium.Core contract creates positions, holds and distributes margin at the maturity
contract Core is LibDerivative, LibCommission, UsingRegistry, CoreErrors, ReentrancyGuard {
    using SafeMath for uint256;
    using NewLibPosition for bytes32;
    using SafeERC20 for IERC20;

    // Emitted when Core creates new position
    event Created(address buyer, address seller, bytes32 derivativeHash, uint256 quantity);
    // Emitted when Core executes positions
    event Executed(address tokenOwner, address positionAddress, uint256 quantity);
    // Emitted when Core cancels ticker for the first time
    event Canceled(bytes32 derivativeHash);

    // Period of time after which ticker could be canceled if no data was provided to the `oracleId`
    uint256 public constant NO_DATA_CANCELLATION_PERIOD = 2 weeks;

    // Vaults for pools
    // This mapping holds balances of pooled positions
    // poolVaults[syntheticAddress][tokenAddress] => availableBalance
    mapping (address => mapping(address => uint256)) public poolVaults;

    // Vaults for fees
    // This mapping holds balances of fee recipients
    // feesVaults[feeRecipientAddress][tokenAddress] => availableBalance
    mapping (address => mapping(address => uint256)) public feesVaults;

    // Hashes of cancelled tickers
    mapping (bytes32 => bool) public cancelled;

    /// @notice Calls Core.Lib.UsingRegistry constructor
    constructor(address _registry) UsingRegistry(_registry) {}

    // PUBLIC FUNCTIONS

    /// @notice This function allows fee recipients to withdraw their fees
    /// @param _tokenAddress address Address of an ERC20 token to withdraw
    function withdrawFee(address _tokenAddress) public nonReentrant {
        uint256 balance = feesVaults[msg.sender][_tokenAddress];
        feesVaults[msg.sender][_tokenAddress] = 0;
        IERC20(_tokenAddress).safeTransfer(msg.sender, balance);
    }

    /// @notice Creates derivative contracts (positions)
    /// @param _derivative Derivative Derivative definition
    /// @param _quantity uint256 Quantity of derivatives to be created
    /// @param _addresses address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address - if seller is set to `address(0)`, consider as pooled position
    function create(Derivative memory _derivative, uint256 _quantity, address[2] memory _addresses) public nonReentrant {
        _create(_derivative, _quantity, _addresses);
    }

    /// @notice Executes several positions of `msg.sender` with same `tokenId`
    /// @param _positionAddress uint256 `tokenId` of positions that needs to be executed
    /// @param _quantity uint256 Quantity of positions to execute
    /// @param _derivative Derivative Derivative definition
    function execute(address _positionAddress, uint256 _quantity, Derivative memory _derivative) public nonReentrant {
        address[] memory positionAddresses = new address[](1);
        uint256[] memory quantities = new uint256[](1);
        Derivative[] memory derivatives = new Derivative[](1);

        positionAddresses[0] = _positionAddress;
        quantities[0] = _quantity;
        derivatives[0] = _derivative;

        _execute(msg.sender, positionAddresses, quantities, derivatives);
    }

    /// @notice Executes several positions of `_tokenOwner` with same `tokenId`
    /// @param _tokenOwner address Address of the owner of positions
    /// @param _positionAddress uint256 `tokenId` of positions that needs to be executed
    /// @param _quantity uint256 Quantity of positions to execute
    /// @param _derivative Derivative Derivative definition
    function execute(address _tokenOwner, address _positionAddress, uint256 _quantity, Derivative memory _derivative) public nonReentrant {
        address[] memory positionAddresses = new address[](1);
        uint256[] memory quantities = new uint256[](1);
        Derivative[] memory derivatives = new Derivative[](1);

        positionAddresses[0] = _positionAddress;
        quantities[0] = _quantity;
        derivatives[0] = _derivative;

        _execute(_tokenOwner, positionAddresses, quantities, derivatives);
    }

    /// @notice Executes several positions of `msg.sender` with different `tokenId`s
    /// @param _positionAddresses uint256[] `tokenId`s of positions that needs to be executed
    /// @param _quantities uint256[] Quantity of positions to execute for each `tokenId`
    /// @param _derivatives Derivative[] Derivative definitions for each `tokenId`
    function execute(address[] memory _positionAddresses, uint256[] memory _quantities, Derivative[] memory _derivatives) public nonReentrant {
        _execute(msg.sender, _positionAddresses, _quantities, _derivatives);
    }

    /// @notice Executes several positions of `_tokenOwner` with different `tokenId`s
    /// @param _tokenOwner address Address of the owner of positions
    /// @param _positionAddresses uint256[] `tokenId`s of positions that needs to be executed
    /// @param _quantities uint256[] Quantity of positions to execute for each `tokenId`
    /// @param _derivatives Derivative[] Derivative definitions for each `tokenId`
    /// execute many addresses
    function execute(address _tokenOwner, address[] memory _positionAddresses, uint256[] memory _quantities, Derivative[] memory _derivatives) public nonReentrant {
        _execute(_tokenOwner, _positionAddresses, _quantities, _derivatives);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionAddress uint256 `tokenId` of positions that needs to be canceled
    /// @param _quantity uint256 Quantity of positions to cancel
    /// @param _derivative Derivative Derivative definition
    function cancel(address _positionAddress, uint256 _quantity, Derivative memory _derivative) public nonReentrant {
        address[] memory positionAddresses = new address[](1);
        uint256[] memory quantities = new uint256[](1);
        Derivative[] memory derivatives = new Derivative[](1);

        positionAddresses[0] = _positionAddress;
        quantities[0] = _quantity;
        derivatives[0] = _derivative;

        _cancel(positionAddresses, quantities, derivatives);
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionAddresses uint256[] `tokenId` of positions that needs to be canceled
    /// @param _quantities uint256[] Quantity of positions to cancel for each `tokenId`
    /// @param _derivatives Derivative[] Derivative definitions for each `tokenId`
    function cancel(address[] memory _positionAddresses, uint256[] memory _quantities, Derivative[] memory _derivatives) public nonReentrant {
        _cancel(_positionAddresses, _quantities, _derivatives);
    }

    // PRIVATE FUNCTIONS

    struct CreatePooledLocalVars {
        SyntheticAggregator syntheticAggregator;
        IDerivativeLogic derivativeLogic;
        IERC20 marginToken;
        TokenSpender tokenSpender;
        OpiumProxyFactory opiumProxyFactory;
    }

    struct CreateLocalVars {
        SyntheticAggregator syntheticAggregator;
        IDerivativeLogic derivativeLogic;
        IERC20 marginToken;
        TokenSpender tokenSpender;
        OpiumProxyFactory opiumProxyFactory;
    }

    /// @notice This function creates p2p positions
    /// @param _derivative Derivative Derivative definition
    /// @param _quantity uint256 Quantity of positions to create
    /// @param _addresses address[2] Addresses of buyer and seller
    /// [0] - buyer address
    /// [1] - seller address
    function _create(Derivative memory _derivative, uint256 _quantity, address[2] memory _addresses) private {
        // Local variables
        CreateLocalVars memory vars;

        // Create instance of Opium.SyntheticAggregator
        // Create instance of Opium.IDerivativeLogic
        // Create instance of margin token
        // Create instance of Opium.TokenSpender
        // Create instance of Opium.OpiumProxyFactory
        vars.syntheticAggregator = SyntheticAggregator(registry.getSyntheticAggregator());
        vars.derivativeLogic = IDerivativeLogic(_derivative.syntheticId);
        vars.marginToken = IERC20(_derivative.token);
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

        // Check ERC20 tokens allowance: (margins[0] + margins[1]) * quantity
        // `msg.sender` must provide margin for position creation
        require(vars.marginToken.allowance(msg.sender, address(vars.tokenSpender)) >= margins[0].add(margins[1]).mul(_quantity), ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE);

    	// Take ERC20 tokens from msg.sender, should never revert in correct ERC20 implementation
        vars.tokenSpender.claimTokens(vars.marginToken, msg.sender, address(this), margins[0].add(margins[1]).mul(_quantity));

        // Mint LONG and SHORT positions tokens
        vars.opiumProxyFactory.mint(_addresses[0], _addresses[1], derivativeHash, _quantity);

        emit Created(_addresses[0], _addresses[1], derivativeHash, _quantity);
    }

    struct ExecuteAndCancelLocalVars {
        OpiumProxyFactory opiumProxyFactory;
        OracleAggregator oracleAggregator;
        SyntheticAggregator syntheticAggregator;
    }

    /// @notice Executes several positions of `_tokenOwner` with different `tokenId`s
    /// @param _tokenOwner address Address of the owner of positions
    /// @param _positionAddresses uint256[] `tokenId`s of positions that needs to be executed
    /// @param _quantities uint256[] Quantity of positions to execute for each `tokenId`
    /// @param _derivatives Derivative[] Derivative definitions for each `tokenId`
    function _execute(address _tokenOwner, address[] memory _positionAddresses, uint256[] memory _quantities, Derivative[] memory _derivatives) private {
        require(_positionAddresses.length == _quantities.length, ERROR_CORE_TOKEN_IDS_AND_QUANTITIES_LENGTH_DOES_NOT_MATCH);
        require(_positionAddresses.length == _derivatives.length, ERROR_CORE_TOKEN_IDS_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH);

        // Local variables
        ExecuteAndCancelLocalVars memory vars;

        // Create instance of Opium.OpiumProxyFactory
        // Create instance of Opium.OracleAggregator
        // Create instance of Opium.SyntheticAggregator
        vars.opiumProxyFactory = OpiumProxyFactory(registry.getOpiumProxyFactory());
        vars.oracleAggregator = OracleAggregator(registry.getOracleAggregator());
        vars.syntheticAggregator = SyntheticAggregator(registry.getSyntheticAggregator());

        for (uint256 i; i < _positionAddresses.length; i++) {
            // Check if execution is performed after endTime
            require(block.timestamp > _derivatives[i].endTime, ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED);

            // Checking whether execution is performed by `_tokenOwner` or `_tokenOwner` allowed third party executions on it's behalf
            require(
                _tokenOwner == msg.sender ||
                IDerivativeLogic(_derivatives[i].syntheticId).thirdpartyExecutionAllowed(_tokenOwner),
                ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED
            );

            // Returns payout for all positions
            uint256 payout = _getPayout(_derivatives[i], _positionAddresses[i], _quantities[i], vars);

            // Transfer payout
            if (payout > 0) {
                IERC20(_derivatives[i].token).safeTransfer(_tokenOwner, payout);
            }

            // Burn executed position tokens
            vars.opiumProxyFactory.burn(_tokenOwner, _positionAddresses[i], _quantities[i]);

            emit Executed(_tokenOwner, _positionAddresses[i], _quantities[i]);
        }
    }

    /// @notice Cancels tickers, burns positions and returns margins to positions owners in case no data were provided within `NO_DATA_CANCELLATION_PERIOD`
    /// @param _positionAddresses uint256[] `tokenId` of positions that needs to be canceled
    /// @param _quantities uint256[] Quantity of positions to cancel for each `tokenId`
    /// @param _derivatives Derivative[] Derivative definitions for each `tokenId`
    function _cancel(address[] memory _positionAddresses, uint256[] memory _quantities, Derivative[] memory _derivatives) private {
        require(_positionAddresses.length == _quantities.length, ERROR_CORE_TOKEN_IDS_AND_QUANTITIES_LENGTH_DOES_NOT_MATCH);
        require(_positionAddresses.length == _derivatives.length, ERROR_CORE_TOKEN_IDS_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH);

        // Local variables
        ExecuteAndCancelLocalVars memory vars;

        // Create instance of Opium.OpiumProxyFactory
        // Create instance of Opium.OracleAggregator
        // Create instance of Opium.SyntheticAggregator
        vars.opiumProxyFactory = OpiumProxyFactory(registry.getOpiumProxyFactory());
        vars.oracleAggregator = OracleAggregator(registry.getOracleAggregator());
        vars.syntheticAggregator = SyntheticAggregator(registry.getSyntheticAggregator());

        for (uint256 i; i < _positionAddresses.length; i++) {
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
            // Check if `_positionAddresses` is an ID of LONG position
            if (derivativeHash.computeLongPositionAddress(registry.getOpiumProxyFactory()) == _positionAddresses[i]) {
                // Set payout to buyerPayout
                payout = margins[0];

            // Check if `_tokenId` is an ID of SHORT position
            } else if (derivativeHash.computeShortPositionAddress(registry.getOpiumProxyFactory()) == _positionAddresses[i]) {
                // Set payout to sellerPayout
                payout = margins[1];
            } else {
                // Either portfolioId, hack or bug
                revert(ERROR_CORE_UNKNOWN_POSITION_TYPE);
            }
            
            // Transfer payout * _quantities[i]
            if (payout > 0) {
                IERC20(_derivatives[i].token).safeTransfer(msg.sender, payout.mul(_quantities[i]));
            }

            // Burn canceled position tokens
            vars.opiumProxyFactory.burn(msg.sender, _positionAddresses[i], _quantities[i]);
        }
    }

    /// @notice Calculates payout for position and gets fees
    /// @param _derivative Derivative Derivative definition
    /// @param _positionAddress uint256 `tokenId` of positions
    /// @param _quantity uint256 Quantity of positions
    /// @param _vars ExecuteAndCancelLocalVars Helping local variables
    /// @return payout uint256 Payout for all tokens
    function _getPayout(Derivative memory _derivative, address _positionAddress, uint256 _quantity, ExecuteAndCancelLocalVars memory _vars) private returns (uint256 payout) {
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
        (payoutRatio[0], payoutRatio[1]) = IDerivativeLogic(_derivative.syntheticId).getExecutionPayout(_derivative, data);

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

        // Check if `_positionAddresses` is an ID of LONG position
        if (derivativeHash.computeLongPositionAddress(registry.getOpiumProxyFactory()) == _positionAddress) {
            // Check if it's a pooled position
            if (_vars.syntheticAggregator.isPool(derivativeHash, _derivative)) {
                // Pooled position payoutRatio is considered as full payout, not as payoutRatio
                payout = payoutRatio[0];

                // Multiply payout by quantity
                payout = payout.mul(_quantity);

                // Check sufficiency of syntheticId balance in poolVaults
                require(
                    poolVaults[_derivative.syntheticId][_derivative.token] >= payout
                    ,
                    ERROR_CORE_INSUFFICIENT_POOL_BALANCE
                );

                // Subtract paid out margin from poolVault
                poolVaults[_derivative.syntheticId][_derivative.token] = poolVaults[_derivative.syntheticId][_derivative.token].sub(payout);
            } else {
                // Set payout to buyerPayout
                payout = payouts[0];

                // Multiply payout by quantity
                payout = payout.mul(_quantity);
            }

            // Take fees only from profit makers
            // Check: payout > buyerMargin * quantity
            if (payout > margins[0].mul(_quantity)) {
                // Get Opium and `syntheticId` author fees and subtract it from payout
                payout = payout.sub(_getFees(_vars.syntheticAggregator, derivativeHash, _derivative, payout - margins[0].mul(_quantity)));
            }

        // Check if `_positionAddresses` is an ID of SHORT position
        } else if (derivativeHash.computeShortPositionAddress(registry.getOpiumProxyFactory()) == _positionAddress) {
            // Set payout to sellerPayout
            payout = payouts[1];

            // Multiply payout by quantity
            payout = payout.mul(_quantity);

            // Take fees only from profit makers
            // Check: payout > sellerMargin * quantity
            if (payout > margins[1].mul(_quantity)) {
                // Get Opium fees and subtract it from payout
                payout = payout.sub(_getFees(_vars.syntheticAggregator, derivativeHash, _derivative, payout - margins[1].mul(_quantity)));
            }
        } else {
            // Either portfolioId, hack or bug
            revert(ERROR_CORE_UNKNOWN_POSITION_TYPE);
        }
    }

    /// @notice Calculates `syntheticId` author and opium fees from profit makers
    /// @param _syntheticAggregator SyntheticAggregator Instance of Opium.SyntheticAggregator
    /// @param _derivativeHash bytes32 Derivative hash
    /// @param _derivative Derivative Derivative definition
    /// @param _profit uint256 payout of one position
    /// @return fee uint256 Opium and `syntheticId` author fee
    function _getFees(SyntheticAggregator _syntheticAggregator, bytes32 _derivativeHash, Derivative memory _derivative, uint256 _profit) private returns (uint256 fee) {
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
