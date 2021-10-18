pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// import "./Interface/IOracleId.sol";
import "./Interface/IDerivativeLogic.sol";
import "./Interface/IRegistry.sol";

import "./Lib/LibDerivative.sol";

// import "./Registry/RegistryEntities.sol";

/// @notice Opium.SyntheticAggregator contract initialized, identifies and caches syntheticId sensitive data
contract SyntheticAggregator is Initializable {
    using LibDerivative for LibDerivative.Derivative;
    // Emitted when new ticker is initialized
    event LogSyntheticInit(LibDerivative.Derivative derivative, bytes32 derivativeHash);

    IRegistry private registry;

    struct SyntheticCache {
        uint256 buyerMargin;
        uint256 sellerMargin;
        uint256 commission;
        address authorAddress;
        bool init;
        // SyntheticTypes typeByHash;
    }
    mapping(bytes32 => SyntheticCache) private syntheticCaches;

    // EXTERNAL FUNCTIONS

    function initialize(address _registry) external initializer {
        registry = IRegistry(_registry);
    }

    /// @notice Initializes ticker, if was not initialized and returns `syntheticId` author commission from cache
    /// @param _derivativeHash bytes32 Hash of derivative
    /// @param _derivative Derivative Derivative itself
    /// @return commission uint256 Synthetic author commission
    function getAuthorCommission(bytes32 _derivativeHash, LibDerivative.Derivative calldata _derivative)
        external
        returns (uint256 commission)
    {
        // SyntheticCache memory syntheticCache = syntheticCaches[_derivativeHash];
        // Initialize derivative if wasn't initialized before
        _initDerivative(_derivativeHash, _derivative);
        commission = syntheticCaches[_derivativeHash].commission;
    }

    /// @notice Initializes ticker, if was not initialized and returns `syntheticId` author address from cache
    /// @param _derivativeHash bytes32 Hash of derivative
    /// @param _derivative Derivative Derivative itself
    /// @return authorAddress address Synthetic author address
    function getAuthorAddress(bytes32 _derivativeHash, LibDerivative.Derivative calldata _derivative)
        external
        returns (address authorAddress)
    {
        // Initialize derivative if wasn't initialized before
        _initDerivative(_derivativeHash, _derivative);
        authorAddress = syntheticCaches[_derivativeHash].authorAddress;
    }

    /// @notice Initializes ticker, if was not initialized and returns buyer and seller margin from cache
    /// @param _derivativeHash bytes32 Hash of derivative
    /// @param _derivative Derivative Derivative itself
    /// @return buyerMargin uint256 Margin of buyer
    /// @return sellerMargin uint256 Margin of seller
    function getMargin(bytes32 _derivativeHash, LibDerivative.Derivative calldata _derivative)
        external
        returns (uint256 buyerMargin, uint256 sellerMargin)
    {
        // Initialize derivative if wasn't initialized before
        _initDerivative(_derivativeHash, _derivative);
        SyntheticCache memory syntheticCache = syntheticCaches[_derivativeHash];
        return (syntheticCache.buyerMargin, syntheticCache.sellerMargin);
    }

    function getSyntheticCache(bytes32 _derivativeHash, LibDerivative.Derivative calldata _derivative)
        external
        returns (SyntheticCache memory)
    {
        _initDerivative(_derivativeHash, _derivative);
        return syntheticCaches[_derivativeHash];
    }

    // PRIVATE FUNCTIONS

    /// @notice Initializes ticker: caches syntheticId type, margin, author address and commission
    /// @param _derivativeHash bytes32 Hash of derivative
    /// @param _derivative Derivative Derivative itself
    function _initDerivative(bytes32 _derivativeHash, LibDerivative.Derivative memory _derivative) private {
        if (syntheticCaches[_derivativeHash].init == true) {
            return;
        }
        // For security reasons we calculate hash of provided _derivative
        bytes32 derivativeHash = _derivative.getDerivativeHash();
        require(derivativeHash == _derivativeHash, "S1"); //ERROR_SYNTHETIC_AGGREGATOR_DERIVATIVE_HASH_NOT_MATCH

        // Get margin from SyntheticId
        (uint256 buyerMargin, uint256 sellerMargin) = IDerivativeLogic(_derivative.syntheticId).getMargin(_derivative);
        // We are not allowing both margins to be equal to 0
        require(buyerMargin != 0 || sellerMargin != 0, "S2"); //ERROR_SYNTHETIC_AGGREGATOR_WRONG_MARGIN

        // AUTHOR COMMISSION
        // Get commission from syntheticId
        uint256 commission = IDerivativeLogic(_derivative.syntheticId).getAuthorCommission();
        // Check if commission is not set > 100%
        RegistryEntities.ProtocolCommissionArgs memory protocolCommissionArgs = registry.getProtocolCommissionParams();
        require(
            commission <= protocolCommissionArgs.derivativeAuthorCommissionBase,
            "S3" //ERROR_SYNTHETIC_AGGREGATOR_COMMISSION_TOO_BIG
        );
        // Cache values by derivative hash
        syntheticCaches[derivativeHash] = SyntheticCache({
            buyerMargin: buyerMargin,
            sellerMargin: sellerMargin,
            commission: commission,
            authorAddress: IDerivativeLogic(_derivative.syntheticId).getAuthorAddress(),
            init: true
        });

        // If we are here, this basically means this ticker was not used before, so we emit an event for Dapps developers about new ticker (derivative) and it's hash
        emit LogSyntheticInit(_derivative, derivativeHash);
    }
}
