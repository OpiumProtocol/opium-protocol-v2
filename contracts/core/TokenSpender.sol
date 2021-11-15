pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./base/RegistryManager.sol";
import "../interfaces/IRegistry.sol";

/**
    Error codes:
    - T1 = ERROR_TOKEN_SPENDER_NOT_WHITELISTED
 */

/// @title Opium.TokenSpender contract holds users ERC20 allowances and allows whitelisted contracts to use ERC20 tokens
contract TokenSpender is Initializable, RegistryManager {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    modifier onlyCoreSpenders() {
        require(registry.isCoreSpenderWhitelisted(msg.sender), "T1");
        _;
    }

    /// @notice it is called only once upon deployment of the contract
    /// @param _registry sets the address of the Opium.Registry
    function initialize(address _registry) external initializer {
        __RegistrySetter__init(msg.sender, _registry);
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
