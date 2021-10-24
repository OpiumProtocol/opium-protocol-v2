pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./Interface/IRegistry.sol";

/**
    Error codes:
    - T1 = ERROR_TOKEN_SPENDER_NOT_WHITELISTED
 */

/// @title Opium.TokenSpender contract holds users ERC20 approvals and allows whitelisted contracts to use tokens
contract TokenSpender is Initializable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    IRegistry private registry;

    modifier onlyCoreSpenders() {
        require(registry.isCoreSpenderWhitelisted(msg.sender), "T1");
        _;
    }

    /// @notice Calls constructors of super-contracts
    /// @param _registry address Address of governor, who is allowed to adjust whitelist
    function initialize(address _registry) external initializer {
        registry = IRegistry(_registry);
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
    ) external onlyCoreSpenders {
        token.safeTransferFrom(from, to, amount);
    }
}
