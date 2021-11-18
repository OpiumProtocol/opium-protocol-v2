pragma solidity 0.8.5;

library LibRoles {
    bytes32 internal constant PROTOCOL_ADDRESSES_SETTER_ROLE = keccak256("RL1");
    bytes32 internal constant EXECUTION_FEE_RECIPIENT_SETTER_ROLE = keccak256("RL2");
    bytes32 internal constant REDEMPTION_FEE_RECIPIENT_SETTER_ROLE = keccak256("RL3");
    bytes32 internal constant GUARDIAN_ROLE = keccak256("RL4");
    bytes32 internal constant WHITELISTER_ROLE = keccak256("RL5");
    bytes32 internal constant PARAMETER_SETTER_ROLE = keccak256("RL6");
    bytes32 internal constant REGISTRY_MANAGER_ROLE = keccak256("RL7");
    bytes32 internal constant EXECUTION_FEE_CAP_SETTER_ROLE = keccak256("RL8");
    bytes32 internal constant REDEMPTION_FEE_SETTER_ROLE = keccak256("RL9");
}
