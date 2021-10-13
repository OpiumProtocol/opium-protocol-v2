pragma solidity 0.8.5;
pragma experimental ABIEncoderV2;

import "../../SyntheticAggregator.sol";

contract TestSyntheticAggregatorUpgrade is SyntheticAggregator {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
