pragma solidity 0.8.5;

import "../../Lib/Registry/Registry.sol";

contract TestRegistryUpgrade is RegistryUpgradeable {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
