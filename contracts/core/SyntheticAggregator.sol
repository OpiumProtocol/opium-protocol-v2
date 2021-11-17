pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./base/RegistryManager.sol";
import "../interfaces/IDerivativeLogic.sol";
import "../interfaces/IRegistry.sol";
import "../libs/LibDerivative.sol";

/**
    Error codes:
    - S1 = ERROR_SYNTHETIC_AGGREGATOR_DERIVATIVE_HASH_NOT_MATCH
    - S2 = ERROR_SYNTHETIC_AGGREGATOR_WRONG_MARGIN
    - S3 = ERROR_SYNTHETIC_AGGREGATOR_COMMISSION_TOO_BIG
 */

/// @notice Opium.SyntheticAggregator contract initialized, identifies and caches syntheticId sensitive data
contract SyntheticAggregator is ReentrancyGuardUpgradeable, RegistryManager {
    using LibDerivative for LibDerivative.Derivative;
    // Emitted when new ticker is initialized
    event LogSyntheticInit(LibDerivative.Derivative indexed derivative, bytes32 indexed derivativeHash);

    struct SyntheticCache {
        uint256 buyerMargin;
        uint256 sellerMargin;
        uint256 authorCommission;
        address authorAddress;
        bool init;
    }
    mapping(bytes32 => SyntheticCache) private syntheticCaches;

    // EXTERNAL FUNCTIONS

    function initialize(address _registry) external initializer {
        __RegistryManager__init(_registry);
        __ReentrancyGuard_init();
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

    /// @notice Initializes ticker, if was not initialized and returns `syntheticId` author address from cache
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
    function _initDerivative(bytes32 _derivativeHash, LibDerivative.Derivative memory _derivative) private nonReentrant {
        if (syntheticCaches[_derivativeHash].init == true) {
            return;
        }
        // For security reasons we calculate hash of provided _derivative
        bytes32 derivativeHash = _derivative.getDerivativeHash();
        require(derivativeHash == _derivativeHash, "S1");

        // Get margin from SyntheticId
        (uint256 buyerMargin, uint256 sellerMargin) = IDerivativeLogic(_derivative.syntheticId).getMargin(_derivative);
        // We are not allowing both margins to be equal to 0
        require(buyerMargin != 0 || sellerMargin != 0, "S2");

        // AUTHOR COMMISSION
        // Get commission from syntheticId
        uint256 authorCommission = IDerivativeLogic(_derivative.syntheticId).getAuthorCommission();
        // Check if commission is not set > 100%
        RegistryEntities.ProtocolParametersArgs memory protocolParametersArgs = registry.getProtocolParameters();
        require(
            authorCommission <= protocolParametersArgs.derivativeAuthorCommissionBase,
            "S3"
        );
        // Cache values by derivative hash
        syntheticCaches[derivativeHash] = SyntheticCache({
            buyerMargin: buyerMargin,
            sellerMargin: sellerMargin,
            authorCommission: authorCommission,
            authorAddress: IDerivativeLogic(_derivative.syntheticId).getAuthorAddress(),
            init: true
        });

        // If we are here, this basically means this ticker was not used before, so we emit an event for Dapps developers about new ticker (derivative) and it's hash
        emit LogSyntheticInit(_derivative, derivativeHash);
    }
}
