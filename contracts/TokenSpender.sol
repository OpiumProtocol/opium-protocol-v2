pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Lib/WhitelistedWithGovernance.sol";

/// @title Opium.TokenSpender contract holds users ERC20 approvals and allows whitelisted contracts to use tokens
contract TokenSpender is WhitelistedWithGovernance {
    using SafeERC20 for IERC20;

    // Initial timelock period
    uint256 public constant WHITELIST_TIMELOCK = 1 hours;

    /// @notice Calls constructors of super-contracts
    /// @param _governor address Address of governor, who is allowed to adjust whitelist
    constructor(address _governor) WhitelistedWithGovernance(WHITELIST_TIMELOCK, _governor) {}

    /// @notice Using this function whitelisted contracts could call ERC20 transfers
    /// @param token IERC20 Instance of token
    /// @param from address Address from which tokens are transferred
    /// @param to address Address of tokens receiver
    /// @param amount uint256 Amount of tokens to be transferred
    function claimTokens(IERC20 token, address from, address to, uint256 amount) external onlyWhitelisted {
        token.safeTransferFrom(from, to, amount);
    }

    /// @notice Using this function whitelisted contracts could call ERC721O transfers
    /// @param token IERC20 Instance of token
    /// @param from address Address from which tokens are transferred
    /// @param to address Address of tokens receiver
    /// @param amount uint256 Amount of tokens to be transferred
    function claimPositions(IERC20 token, address from, address to, uint256 tokenId, uint256 amount) external onlyWhitelisted {
        token.safeTransferFrom(from, to, amount);
    }
}
