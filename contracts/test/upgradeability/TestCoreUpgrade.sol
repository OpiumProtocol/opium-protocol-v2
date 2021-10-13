pragma solidity 0.8.5;
pragma experimental ABIEncoderV2;

import "../../Core.sol";

/// @title Opium.Core contract creates positions, holds and distributes margin at the maturity
contract TestCoreUpgrade is Core {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
