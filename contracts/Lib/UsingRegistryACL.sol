pragma solidity ^0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../Interface/IOpiumPositionToken.sol";
import "../Interface/IOpiumProxyFactory.sol";
import "../Interface/IRegistry.sol";

abstract contract UsingRegistryACL is Initializable {
    // Instance of Opium.Registry contract
    IRegistry internal registry;

    /// @notice Defines registry instance and emits appropriate event
    function __UsingRegistryACL__init(address _registry) internal initializer {
        registry = IRegistry(_registry);
    }

    /// @notice This modifier restricts access to functions, which could be called only by Opium.Core
    modifier onlyCore() {
        require(msg.sender == registry.getCore(), "only core");
        _;
    }

    modifier onlyWhitelisted() {
        require(registry.isWhitelisted(msg.sender), "not whitelisted");
        _;
    }

    modifier onlyOpiumFactoryTokens(address _tokenAddress) {
        require(IOpiumPositionToken(_tokenAddress).getFactoryAddress() == registry.getOpiumProxyFactory(), "not factory");
        _;
    }

    modifier whenNotPaused() {
        require(registry.isPaused() == false, "paused");
        _;
    }

    /// @notice Getter for registry variable
    /// @return address Address of registry set in current contract
    function getRegistry() external view returns (address) {
        return address(registry);
    }
}