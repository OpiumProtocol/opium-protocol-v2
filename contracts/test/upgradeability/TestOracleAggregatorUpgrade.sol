pragma solidity 0.8.5;
import "../../core/OracleAggregator.sol";

contract TestOracleAggregatorUpgrade is OracleAggregator {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
