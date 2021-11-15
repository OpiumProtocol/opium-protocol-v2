pragma solidity 0.8.5;

import "../../../interfaces/IRegistry.sol";
import "../../../interfaces/IOracleAggregator.sol";

contract OracleIdMock {
    uint256 fetchPrice;
    IRegistry registry;

    constructor(uint256 _fetchPrice, address _registry) {
        fetchPrice = _fetchPrice;
        registry = IRegistry(_registry);
    }

    function triggerCallback(uint256 timestamp, uint256 returnData) external {
        IOracleAggregator(registry.getOracleAggregator()).__callback(timestamp, returnData);
    }
}
