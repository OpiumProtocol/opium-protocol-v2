// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "../../core/SyntheticAggregator.sol";

contract TestSyntheticAggregatorUpgrade is SyntheticAggregator {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
