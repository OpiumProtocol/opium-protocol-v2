// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";
import "../../../interfaces/IRegistry.sol";
import "../../../interfaces/IOracleAggregator.sol";

contract ChainlinkOracleSubId {
    event LogDataProvision(address _from, address _to, uint256 _timestamp, uint256 _data);
    // AAVE/ETH price feed (18 decimals)
    AggregatorV3Interface private constant priceFeed =
        AggregatorV3Interface(0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012);
    // Opium Protocol Registry
    IRegistry private immutable registry;

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    /// @param _derivativeEndTime uint256 the maturity of the derivative contract that uses ChainlinkOracleSubId as its oracleId
    function triggerCallback(uint256 _derivativeEndTime) external {
        // fetches the data and the timestamp from the Chainlink pricefeed
        (uint256 price, uint256 timestamp) = getLatestPrice();
        // fetches the Opium.OracleAggregator from the Opium.Registry
        IOracleAggregator oracleAggregator = IOracleAggregator(registry.getProtocolAddresses().oracleAggregator);
        // logs the relevant event
        emit LogDataProvision(address(priceFeed), address(oracleAggregator), timestamp, price);
        // pushes the data into the OracleAggregator
        oracleAggregator.__callback(_derivativeEndTime, price);
    }

    function getLatestPrice() private view returns (uint256, uint256) {
        (, int256 price, , uint256 timestamp, ) = priceFeed.latestRoundData();
        return (uint256(price), timestamp);
    }
}
