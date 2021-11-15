pragma solidity 0.8.5;

library LibRoles {
    bytes32 internal constant PROTOCOL_REGISTER_ROLE = keccak256("PROTOCOL_REGISTER_ROLE");
    bytes32 internal constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 internal constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE"); 
    bytes32 internal constant PARAMETER_SETTER_ROLE = keccak256("PARAMETER_SETTER_ROLE");
}