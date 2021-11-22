pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./RegistryEntities.sol";
import "../../libs/LibRoles.sol";

/**
    Error codes:
    {check the ./Registry.sol contract}
 */

contract RegistryStorage is AccessControlUpgradeable {
    RegistryEntities.ProtocolParametersArgs internal protocolParametersArgs;
    RegistryEntities.ProtocolAddressesArgs internal protocolAddressesArgs;
    RegistryEntities.ProtocolPausabilityArgs internal protocolPausabilityArgs;
    mapping(address => bool) internal coreSpenderWhitelist;

    /// @notice it ensures that the calling account has been granted the PROTOCOL_ADDRESSES_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyProtocolRegister() {
        require(hasRole(LibRoles.PROTOCOL_ADDRESSES_SETTER_ROLE, msg.sender), "R1");
        _;
    }

    /// @notice it ensures that the calling account has been granted the EXECUTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyProtocolExecutionReserveClaimerAddressSetter() {
        require(hasRole(LibRoles.EXECUTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE, msg.sender), "R2");
        _;
    }

    /// @notice it ensures that the calling account has been granted the REDEMPTION_FEE_RECIPIENT_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyProtocolRedemptionReserveClaimerAddressSetter() {
        require(hasRole(LibRoles.REDEMPTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE, msg.sender), "R3");
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
    modifier onlyExecutionReservePartSetter() {
        require(hasRole(LibRoles.EXECUTION_FEE_CAP_SETTER_ROLE, msg.sender), "R8");
        _;
    }

    /// @notice it ensures that the calling account has been granted the REDEMPTION_RESERVE_PART_SETTER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyRedemptionReservePartSetter() {
        require(hasRole(LibRoles.REDEMPTION_RESERVE_PART_SETTER_ROLE, msg.sender), "R9");
        _;
    }

    /// @notice it ensures that the calling account has been granted the PARTIAL_CREATE_PAUSE_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyPartialCreatePauseSetter() {
        require(hasRole(LibRoles.PARTIAL_CREATE_PAUSE_ROLE, msg.sender), "R13");
        _;
    }

    /// @notice it ensures that the calling account has been granted the PARTIAL_MINT_PAUSE_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyPartialMintPauseSetter() {
        require(hasRole(LibRoles.PARTIAL_MINT_PAUSE_ROLE, msg.sender), "R14");
        _;
    }

    /// @notice it ensures that the calling account has been granted the PARTIAL_REDEEM_PAUSE_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyPartialRedeemPauseSetter() {
        require(hasRole(LibRoles.PARTIAL_REDEEM_PAUSE_ROLE, msg.sender), "R15");
        _;
    }

    /// @notice it ensures that the calling account has been granted the PARTIAL_EXECUTE_PAUSE_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyPartialExecutePauseSetter() {
        require(hasRole(LibRoles.PARTIAL_EXECUTE_PAUSE_ROLE, msg.sender), "R16");
        _;
    }

    /// @notice it ensures that the calling account has been granted the PARTIAL_CANCEL_PAUSE_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyPartialCancelPauseSetter() {
        require(hasRole(LibRoles.PARTIAL_CANCEL_PAUSE_ROLE, msg.sender), "R17");
        _;
    }

    /// @notice it ensures that the calling account has been granted the PARTIAL_CLAIM_RESERVE_PAUSE_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyPartialClaimReservePauseSetter() {
        require(hasRole(LibRoles.PARTIAL_CLAIM_RESERVE_PAUSE_ROLE, msg.sender), "R18");
        _;
    }

    /// @notice it ensures that the calling account has been granted the PROTOCOL_UNPAUSER_ROLE
    /// @dev by default, it is granted to the `governor` account
    modifier onlyProtocolUnpauserSetter() {
        require(hasRole(LibRoles.PROTOCOL_UNPAUSER_ROLE, msg.sender), "R19");
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
        _setupRole(LibRoles.EXECUTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE, _governor);
        _setupRole(LibRoles.REDEMPTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE, _governor);
        _setupRole(LibRoles.OPIUM_FEE_SETTER_ROLE, _governor);
        _setupRole(LibRoles.NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE, _governor);
        _setupRole(LibRoles.GUARDIAN_ROLE, _governor);
        _setupRole(LibRoles.WHITELISTER_ROLE, _governor);
        _setupRole(LibRoles.EXECUTION_FEE_CAP_SETTER_ROLE, _governor);
        _setupRole(LibRoles.REDEMPTION_RESERVE_PART_SETTER_ROLE, _governor);
        _setupRole(LibRoles.REGISTRY_MANAGER_ROLE, _governor);

        _setupRole(LibRoles.PARTIAL_CREATE_PAUSE_ROLE, _governor);
        _setupRole(LibRoles.PARTIAL_MINT_PAUSE_ROLE, _governor);
        _setupRole(LibRoles.PARTIAL_REDEEM_PAUSE_ROLE, _governor);
        _setupRole(LibRoles.PARTIAL_EXECUTE_PAUSE_ROLE, _governor);
        _setupRole(LibRoles.PARTIAL_CANCEL_PAUSE_ROLE, _governor);
        _setupRole(LibRoles.PARTIAL_CLAIM_RESERVE_PAUSE_ROLE, _governor);
        _setupRole(LibRoles.PROTOCOL_UNPAUSER_ROLE, _governor);

        protocolParametersArgs = RegistryEntities.ProtocolParametersArgs({
            noDataCancellationPeriod: 2 weeks,
            derivativeAuthorExecutionReservePartCap: 10000,
            derivativeAuthorRedemptionReservePart: 100,
            protocolExecutionReservePart: 10,
            protocolRedemptionReservePart: 10
        });
    }
}
