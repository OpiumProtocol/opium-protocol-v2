pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../Lib/LibRoles.sol";
import "./RegistryEntities.sol";

/**
    Error codes:
    - R1 = ERROR_REGISTRY_ONLY_PROTOCOL_REGISTER_ROLE
    - R2 = ERROR_REGISTRY_ONLY_GUARDIAN
    - R3 = ERROR_REGISTRY_ONLY_WHITELISTER_ROLE
    - R4 = ERROR_REGISTRY_ONLY_COMMISSION_SETTER_ROLE
 */

contract RegistryStorageUpgradeable is AccessControlUpgradeable {
    RegistryEntities.ProtocolParametersArgs internal protocolParametersArgs;
    RegistryEntities.ProtocolAddressesArgs internal protocolAddressesArgs;
    mapping(address => bool) internal coreSpenderWhitelist;

    modifier onlyProtocolRegister() {
        require(hasRole(LibRoles.PROTOCOL_REGISTER_ROLE, msg.sender), "R1");
        _;
    }

    modifier onlyGuardian() {
        require(hasRole(LibRoles.GUARDIAN_ROLE, msg.sender), "R2");
        _;
    }

    modifier onlyWhitelister() {
        require(hasRole(LibRoles.WHITELISTER_ROLE, msg.sender), "R3");
        _;
    }

    modifier onlyCommissionSetter() {
        require(hasRole(LibRoles.COMMISSION_SETTER_ROLE, msg.sender), "R4");
        _;
    }

    /// @notice internal init function that it is called only once upon deployment of the Opium.Registry contract. It initializes the DEFAULT_ADMIN_ROLE with the given governor address
    /// @dev internally, it assigns all the setters roles to the DEFAULT_ADMIN_ROLE and it sets the initial protocol parameters
    /// @param _governor address of the governance account which will be assigned the initial admin role
    function __RegistryStorage__init(address _governor) internal initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, _governor);
        _setupRole(LibRoles.PROTOCOL_REGISTER_ROLE, _governor);
        _setupRole(LibRoles.GUARDIAN_ROLE, _governor);
        _setupRole(LibRoles.WHITELISTER_ROLE, _governor);
        _setupRole(LibRoles.COMMISSION_SETTER_ROLE, _governor);

        protocolParametersArgs = RegistryEntities.ProtocolParametersArgs({
            noDataCancellationPeriod: 2 weeks,
            derivativeAuthorCommissionBase: 10000,
            protocolFeeCommissionBase: 10,
            protocolCommissionPart: 1,
            precisionFactor: 18,
            paused: false
        });
    }
}
