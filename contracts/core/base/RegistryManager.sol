pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../interfaces/IRegistry.sol";

/**
    Error codes:
    - M1 = ERROR_REGISTRY_MANAGER_ONLY_REGISTRY_MANAGER_ROLE
 */
contract RegistryManager is Initializable {
    event LogRegistryChange(address indexed _changer, address indexed _newRegistryAddress);

    IRegistry internal registry;

    modifier onlyRegistryManager() {
        require(registry.isRegistryManager(msg.sender), "M1");
        _;
    }

    function __RegistryManager__init(address _registry) internal initializer {
        require(_registry != address(0));
        registry = IRegistry(_registry);
    }

    function setRegistry(address _registry) external onlyRegistryManager {
        registry = IRegistry(_registry);
        emit LogRegistryChange(msg.sender, _registry);
    }

    function getRegistry() external view returns (address) {
        return address(registry);
    }
}
