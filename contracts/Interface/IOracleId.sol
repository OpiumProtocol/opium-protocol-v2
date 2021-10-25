pragma solidity 0.8.5;

/// @title Opium.Interface.IOracleId contract is an interface that every oracleId should implement
interface IOracleId {
    /// @notice Provides data to Opium.OracleAggregator
    /// @param _timestamp uint256 Timestamp at which data are needed for the first time
    /// @param _data uint256 data being provided to the OracleAggregator
    function triggerCallback(uint256 _timestamp, uint256 _data) external;
}
