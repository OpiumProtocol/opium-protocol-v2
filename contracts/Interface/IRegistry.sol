pragma solidity 0.8.5;
import "../Lib/Registry/RegistryEntities.sol";

interface IRegistry {
    function getCore() external view returns (address);

    function getOpiumProxyFactory() external view returns (address);

    function getOracleAggregator() external view returns (address);

    // function getSyntheticAggregator() external view returns (address);
    function getTokenSpender() external view returns (address);

    function getOpiumFeeReceiver() external view returns (address);

    function getNoDataCancellationPeriod() external view returns (uint256);

    function isWhitelisted(address _address) external view returns (bool);

    // function getOpiumCommissionPart() external view returns (uint256);
    // function getOpiumCommissionBase() external view returns(uint256);
    // function getProtocolCommissionBase() external view returns(uint256);
    function getProtocolCommissionParams() external view returns (RegistryEntities.ProtocolCommissionArgs memory);

    function getExecuteAndCancelLocalVars() external view returns (RegistryEntities.ExecuteAndCancelLocalVars memory);
}
