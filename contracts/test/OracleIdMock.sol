pragma solidity 0.8.5;

import "../Interface/IOracleId.sol";
import "../Lib/UsingRegistry.sol";
import "../OracleAggregator.sol";

contract OracleIdMock is IOracleId, UsingRegistry {
    uint256 fetchPrice;

    constructor(uint256 _fetchPrice, address _registry) UsingRegistry(_registry) {
        fetchPrice = _fetchPrice;
    }

    function triggerCallback(uint256 timestamp, uint256 returnData) external {
        OracleAggregator(registry.getOracleAggregator()).__callback(timestamp, returnData);
    }

    function fetchData(uint256 timestamp) external payable override {
    }

    function recursivelyFetchData(uint256 timestamp, uint256 period, uint256 times) external payable override {
    }

    function calculateFetchPrice() external override returns (uint256) {
        return fetchPrice;
    }
}
