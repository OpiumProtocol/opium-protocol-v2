pragma solidity 0.8.5;
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-IERC20PermitUpgradeable.sol";

contract MockRelayer {
    function callPermit(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // (
        //     address owner,
        //     address spender,
        //     uint256 value,
        //     uint256 deadline,
        //     uint8 v,
        //     bytes32 r,
        //     bytes32 s
        // ) = abi.decode(_data, (
        //     address,
        //     address,
        //     uint256,
        //     uint256,
        //     uint8,
        //     bytes32,
        //     bytes32
        // ));

        IERC20PermitUpgradeable(token).permit(owner, spender, value, deadline, v, r, s);
    }
}
