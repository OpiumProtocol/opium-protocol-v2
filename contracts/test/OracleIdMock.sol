pragma solidity 0.8.5;

import "../Interface/IOracleId.sol";
import "../Interface/IRegistry.sol";
import "../Interface/IOracleAggregator.sol";

contract OracleIdMock is IOracleId {
    uint256 fetchPrice;
    IRegistry registry;

    constructor(uint256 _fetchPrice, address _registry) {
        fetchPrice = _fetchPrice;
        registry = IRegistry(_registry);
    }

    function triggerCallback(uint256 timestamp, uint256 returnData) external {
        IOracleAggregator(registry.getOracleAggregator()).__callback(timestamp, returnData);
    }

    function fetchData(uint256 timestamp) external payable override {}

    function recursivelyFetchData(
        uint256 timestamp,
        uint256 period,
        uint256 times
    ) external payable override {}

    function calculateFetchPrice() external override returns (uint256) {
        return fetchPrice;
    }
}
