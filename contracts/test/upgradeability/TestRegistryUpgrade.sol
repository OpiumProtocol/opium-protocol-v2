pragma solidity 0.8.5;

import "../../core/registry/Registry.sol";

contract TestRegistryUpgrade is Registry {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
