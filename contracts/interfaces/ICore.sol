pragma solidity 0.8.5;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../libs/LibDerivative.sol";

interface ICore {
    function withdrawFee(address _tokenAddress) external;

    function create(
        LibDerivative.Derivative calldata _derivative,
        uint256 _amount,
        address[2] calldata _addresses
    ) external;

    function mint(
        uint256 _amount,
        address[2] calldata _positionAddresses,
        address[2] calldata _positionsOwners
    ) external;

    function execute(address _positionAddress, uint256 _amount) external;

    function execute(
        address _positionOwner,
        address _positionAddress,
        uint256 _amount
    ) external;

    function execute(address[] calldata _positionsAddresses, uint256[] calldata _amounts) external;

    function execute(
        address _positionsOwner,
        address[] calldata _positionsAddresses,
        uint256[] calldata _amounts
    ) external;

    function redeem(address[2] calldata _positionAddresses, uint256 _amount) external;

    function redeem(address[2][] calldata _positionsAddresses, uint256[] calldata _amounts) external;

    function cancel(address _positionAddress, uint256 _amount) external;

    function cancel(address[] calldata _positionsAddresses, uint256[] calldata _amounts) external;
}
