pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

import "./Errors/OracleAggregatorErrors.sol";

import "./Interface/IOracleId.sol";

/// @title Opium.OracleAggregator contract requests and caches the data from `oracleId`s and provides them to the Core for positions execution
contract OracleAggregator is OracleAggregatorErrors, ReentrancyGuardUpgradeable {
    using SafeMath for uint256;

    // Storage for the `oracleId` results
    // dataCache[oracleId][timestamp] => data
    mapping(address => mapping(uint256 => uint256)) public dataCache;

    // Flags whether data were provided
    // dataExist[oracleId][timestamp] => bool
    mapping(address => mapping(uint256 => bool)) public dataExist;

    // Flags whether data were requested
    // dataRequested[oracleId][timestamp] => bool
    mapping(address => mapping(uint256 => bool)) public dataRequested;

    // PUBLIC FUNCTIONS

    /// @notice Receives and caches data from `msg.sender`
    /// @param timestamp uint256 Timestamp of data
    /// @param data uint256 Data itself
    function __callback(uint256 timestamp, uint256 data) external {
        // Don't allow to push data twice
        require(!dataExist[msg.sender][timestamp], ERROR_ORACLE_AGGREGATOR_DATA_ALREADY_EXIST);

        // Saving data
        dataCache[msg.sender][timestamp] = data;

        // Flagging that data were received
        dataExist[msg.sender][timestamp] = true;
    }

    // VIEW FUNCTIONS

    /// @notice Returns cached data if they exist, or reverts with an error
    /// @param oracleId address Address of the `oracleId` smart contract
    /// @param timestamp uint256 Timestamp at which data were requested
    /// @return dataResult uint256 Cached data provided by `oracleId`
    function getData(address oracleId, uint256 timestamp) external view returns (uint256 dataResult) {
        // Check if Opium.OracleAggregator has data
        require(hasData(oracleId, timestamp), ERROR_ORACLE_AGGREGATOR_DATA_DOESNT_EXIST);

        // Return cached data
        dataResult = dataCache[oracleId][timestamp];
    }

    /// @notice Getter for dataExist mapping
    /// @param oracleId address Address of the `oracleId` smart contract
    /// @param timestamp uint256 Timestamp at which data were requested
    /// @param result bool Returns whether data were provided already
    function hasData(address oracleId, uint256 timestamp) public view returns (bool result) {
        return dataExist[oracleId][timestamp];
    }
}
