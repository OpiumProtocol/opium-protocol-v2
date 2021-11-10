pragma solidity 0.8.5;
import "../Registry/RegistryEntities.sol";

interface IRegistry {
    function getCore() external view returns (address);

    function getOracleAggregator() external view returns (address);

    function isCoreSpenderWhitelisted(address _address) external view returns (bool);

    function getProtocolAddresses() external view returns (RegistryEntities.ProtocolAddressesArgs memory);

    function getProtocolCommissionParams() external view returns (RegistryEntities.ProtocolParametersArgs memory);

    function isPaused() external view returns (bool);
}
