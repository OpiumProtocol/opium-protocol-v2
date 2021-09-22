pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./Lib/WhitelistedWithGovernanceAndChangableTimelockUpgradeable.sol";

/// @title Opium.TokenSpender contract holds users ERC20 approvals and allows whitelisted contracts to use tokens
contract TokenSpender is Initializable, WhitelistedWithGovernanceAndChangableTimelockUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Initial timelock period
    uint256 public constant WHITELIST_TIMELOCK = 1 hours;

    /// @notice Calls constructors of super-contracts
    /// @param _governor address Address of governor, who is allowed to adjust whitelist
    function initialize(address _governor) public {
        __WhitelistedWithGovernanceAndChangableTimelock__init(WHITELIST_TIMELOCK, _governor);
    }

    /// @notice Using this function whitelisted contracts could call ERC20 transfers
    /// @param token IERC20 Instance of token
    /// @param from address Address from which tokens are transferred
    /// @param to address Address of tokens receiver
    /// @param amount uint256 Amount of tokens to be transferred
    function claimTokens(
        IERC20Upgradeable token,
        address from,
        address to,
        uint256 amount
    ) external onlyWhitelisted {
        token.safeTransferFrom(from, to, amount);
    }

    /// @notice Using this function whitelisted contracts could call ERC20 transfers
    /// @param token IERC20 Instance of token
    /// @param from address Address from which tokens are transferred
    /// @param to address Address of tokens receiver
    /// @param amount uint256 Amount of tokens to be transferred
    function claimPositions(
        IERC20Upgradeable token,
        address from,
        address to,
        uint256 amount
    ) external onlyWhitelisted {
        token.safeTransferFrom(from, to, amount);
    }
}
