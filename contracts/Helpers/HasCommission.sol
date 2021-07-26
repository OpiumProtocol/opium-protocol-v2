pragma solidity 0.5.16;

/// @title Opium.Helpers.HasCommission contract helps to syntheticId development and responsible for commission and author address
contract HasCommission {
    // Address of syntheticId author
    address internal author;
    // Commission is in Opium.Lib.LibCommission.COMMISSION_BASE base
    uint256 constant internal AUTHOR_COMMISSION = 25; // 0.25% of profit

    /// @notice Sets `msg.sender` as syntheticId author
    constructor() public {
        author = msg.sender;
    }

    /// @notice Getter for syntheticId author address
    /// @return address syntheticId author address
    function getAuthorAddress() public view returns (address) {
        return author;
    }

    /// @notice Getter for syntheticId author commission
    /// @return uint26 syntheticId author commission
    function getAuthorCommission() public view returns (uint256) {
        return AUTHOR_COMMISSION;
    }
}
