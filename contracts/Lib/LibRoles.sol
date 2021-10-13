pragma solidity 0.8.5;

library LibRoles {
    bytes32 internal constant LONG_EXECUTOR = keccak256("LONG_EXECUTOR");
    bytes32 internal constant SHORT_EXECUTOR = keccak256("SHORT_EXECUTOR");
    bytes32 internal constant GUARDIAN = keccak256("GUARDIAN"); 
}