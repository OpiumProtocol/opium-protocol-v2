pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./RegistryEntities.sol";
import "../../libs/LibRoles.sol";

/**
    Error codes:
    {check the ./Registry.sol contract}
 */

contract RegistryStorageUpgradeable is AccessControlUpgradeable {
    RegistryEntities.ProtocolParametersArgs internal protocolParametersArgs;
    RegistryEntities.ProtocolAddressesArgs internal protocolAddressesArgs;
    mapping(address => bool) internal coreSpenderWhitelist;

    /// @notice it ensures that the calling account has been granted the PROTOCOL_ADDRESSES_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyProtocolRegister() {
        require(hasRole(LibRoles.PROTOCOL_ADDRESSES_SETTER_ROLE, msg.sender), "R1");
        _;
    }

    /// @notice it ensures that the calling account has been granted the EXECUTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyProtocolExecutionFeeAddressSetter() {
        require(hasRole(LibRoles.EXECUTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE, msg.sender), "R2");
        _;
    }

    /// @notice it ensures that the calling account has been granted the REDEMPTION_FEE_RECIPIENT_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyProtocolRedemptionAddressFeeSetter() {
        require(hasRole(LibRoles.REDEMPTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE, msg.sender), "R3");
        _;
    }

    /// @notice it ensures that the calling account has been granted the OPIUM_FEE_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyOpiumFeeSetter() {
        require(hasRole(LibRoles.OPIUM_FEE_SETTER_ROLE, msg.sender), "R4");
        _;
    }

    /// @notice it ensures that the calling account has been granted the NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyNoDataCancellationPeriodSetter() {
        require(hasRole(LibRoles.NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE, msg.sender), "R5");
        _;
    }

    /// @notice it ensures that the calling account has been granted the GUARDIAN_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyGuardian() {
        require(hasRole(LibRoles.GUARDIAN_ROLE, msg.sender), "R6");
        _;
    }

    /// @notice it ensures that the calling account has been granted the WHITELISTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyWhitelister() {
        require(hasRole(LibRoles.WHITELISTER_ROLE, msg.sender), "R7");
        _;
    }

    /// @notice it ensures that the calling account has been granted the EXECUTION_FEE_CAP_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyExecutionFeeCapSetter() {
        require(hasRole(LibRoles.EXECUTION_FEE_CAP_SETTER_ROLE, msg.sender), "R8");
        _;
    }

    /// @notice it ensures that the calling account has been granted the REDEMPTION_FEE_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyRedemptionFeeSetter() {
        require(hasRole(LibRoles.REDEMPTION_FEE_SETTER_ROLE, msg.sender), "R9");
        _;
    }

    /// @notice internal init function that it is called only once upon deployment of the Opium.Registry contract. It initializes the DEFAULT_ADMIN_ROLE with the given governor address
    /// @notice it sets the default ProtocolParametersArgs protocol parameters
    /// @dev internally, it assigns all the setters roles to the DEFAULT_ADMIN_ROLE and it sets the initial protocol parameters
    /// @param _governor address of the governance account which will be assigned the initial admin role
    function __RegistryStorage__init(address _governor) internal initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, _governor);
        _setupRole(LibRoles.PROTOCOL_ADDRESSES_SETTER_ROLE, _governor);
        _setupRole(LibRoles.EXECUTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE, _governor);
        _setupRole(LibRoles.REDEMPTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE, _governor);
        _setupRole(LibRoles.OPIUM_FEE_SETTER_ROLE, _governor);
        _setupRole(LibRoles.NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE, _governor);
        _setupRole(LibRoles.GUARDIAN_ROLE, _governor);
        _setupRole(LibRoles.WHITELISTER_ROLE, _governor);
        _setupRole(LibRoles.EXECUTION_FEE_CAP_SETTER_ROLE, _governor);
        _setupRole(LibRoles.REDEMPTION_FEE_SETTER_ROLE, _governor);
        _setupRole(LibRoles.REGISTRY_MANAGER_ROLE, _governor);

        protocolParametersArgs = RegistryEntities.ProtocolParametersArgs({
            noDataCancellationPeriod: 2 weeks,
            derivativeAuthorExecutionFeeCap: 10000,
            derivativeAuthorRedemptionFee: 100,
            protocolCommissionPart: 1,
            paused: false
        });
    }
}
