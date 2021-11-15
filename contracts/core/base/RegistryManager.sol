pragma solidity 0.8.5;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../../interfaces/IRegistry.sol";

contract RegistryManager is OwnableUpgradeable {
    IRegistry internal registry;
    function __RegistrySetter__init(address _registryManager, address _registry) internal initializer {
        __Ownable_init();
        transferOwnership(_registryManager);
        registry = IRegistry(_registry);
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = IRegistry(_registry);
    }
}