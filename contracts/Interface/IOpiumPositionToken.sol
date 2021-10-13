pragma solidity 0.8.5;
import "../Lib/LibDerivative.sol";

interface IOpiumPositionToken {
    function initialize(
        string memory name,
        string memory symbol,
        LibDerivative.Derivative calldata _derivative,
        bytes32 _derivativeHash,
        LibDerivative.PositionType _positionType
    ) external;

    function mint(address _address, uint256 _amount) external;

    function burn(address _address, uint256 _amount) external;

    function getDerivative() external view returns (LibDerivative.Derivative calldata derivative);

    function getPositionType() external view returns (LibDerivative.PositionType);

    function getFactoryAddress() external view returns (address);

    function getDerivativeHash() external view returns (bytes32);
}
