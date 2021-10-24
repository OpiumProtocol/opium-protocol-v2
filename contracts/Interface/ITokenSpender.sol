pragma solidity 0.8.5;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface ITokenSpender {
    function claimTokens(
        IERC20Upgradeable token,
        address from,
        address to,
        uint256 amount
    ) external;
}
