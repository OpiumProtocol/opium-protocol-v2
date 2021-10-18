pragma solidity 0.8.5;
import "../Registry/RegistryEntities.sol";

interface IRegistry {
    function getCore() external view returns (address);

    function getOpiumProxyFactory() external view returns (address);

    function getOracleAggregator() external view returns (address);

    function getTokenSpender() external view returns (address);

    function getOpiumFeeReceiver() external view returns (address);

    function getNoDataCancellationPeriod() external view returns (uint256);

    function isWhitelisted(address _address) external view returns (bool);

    function getProtocolAddresses() external view returns (RegistryEntities.ProtocolAddressesArgs memory);

    function getProtocolCommissionParams() external view returns (RegistryEntities.ProtocolCommissionArgs memory);

    function getExecuteAndCancelLocalVars() external view returns (RegistryEntities.ExecuteAndCancelLocalVars memory);

    function isRole(bytes32 _role, address _address) external view returns (bool);

    function isPaused() external view returns (bool);
}
