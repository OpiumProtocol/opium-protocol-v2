pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-IERC20PermitUpgradeable.sol";
import "../libs/LibDerivative.sol";

interface IOpiumPositionToken is IERC20PermitUpgradeable {
    struct OpiumPositionTokenParams {
        LibDerivative.Derivative derivative;
        LibDerivative.PositionType positionType;
        bytes32 derivativeHash;
    }

    function initialize(
        bytes32 _derivativeHash,
        LibDerivative.PositionType _positionType,
        LibDerivative.Derivative calldata _derivative,
        bytes memory customName
    ) external;

    function mint(address _address, uint256 _amount) external;

    function burn(address _address, uint256 _amount) external;

    function getFactoryAddress() external view returns (address);

    function getPositionTokenData() external view returns (OpiumPositionTokenParams memory opiumPositionTokenParams);

    function getChainId() external view returns (uint256);
}
