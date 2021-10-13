pragma solidity 0.8.5;

contract RegistryErrors {
    string internal constant ERROR_REGISTRY_ONLY_INITIALIZER = "REGISTRY:ONLY_INITIALIZER";
    string internal constant ERROR_REGISTRY_ONLY_OPIUM_ADDRESS_ALLOWED = "REGISTRY:ONLY_OPIUM_ADDRESS_ALLOWED";

    string internal constant ERROR_REGISTRY_CANT_BE_ZERO_ADDRESS = "REGISTRY:CANT_BE_ZERO_ADDRESS";

    string internal constant ERROR_REGISTRY_ALREADY_SET = "REGISTRY:ALREADY_SET";

    string internal constant NOT_GOVERNOR = "NOT_GOVERNOR";

    string internal constant NOT_LONG_EXECUTOR = "NOT_LONG_EXECUTOR";

    string internal constant NOT_SHORT_EXECUTOR = "NOT_SHORT_EXECUTOR";
}
