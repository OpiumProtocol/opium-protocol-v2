// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "../../core/Core.sol";

/// @title Opium.Core contract creates positions, holds and distributes margin at the maturity
contract TestCoreUpgrade is Core {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
