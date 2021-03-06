// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

/// @title Opium.Helpers.HasCommission contract helps to syntheticId development and responsible for commission and author address
abstract contract HasCommission {
    // Address of syntheticId author
    address private author;
    // Commission is in Opium.Lib.LibCommission.COMMISSION_BASE base
    uint256 private constant AUTHOR_COMMISSION = 25; // 0.25% of profit

    /// @notice Sets `msg.sender` as syntheticId author
    constructor() {
        author = msg.sender;
    }

    /// @notice Getter for syntheticId author address
    /// @return address syntheticId author address
    function getAuthorAddress() public view virtual returns (address) {
        return author;
    }

    /// @notice Getter for syntheticId author commission
    /// @return uint26 syntheticId author commission
    function getAuthorCommission() public view virtual returns (uint256) {
        return AUTHOR_COMMISSION;
    }
}
