pragma solidity 0.8.5;
import "../libs/LibDerivative.sol";

interface IOpiumPositionToken {
    struct OpiumPositionTokenParams {
        LibDerivative.Derivative derivative;
        LibDerivative.PositionType positionType;
        bytes32 derivativeHash;
    }

    function initialize(
        bytes32 _derivativeHash,
        LibDerivative.PositionType _positionType,
        LibDerivative.Derivative calldata _derivative
    ) external;

    function mint(address _address, uint256 _amount) external;

    function burn(address _address, uint256 _amount) external;

    function getFactoryAddress() external view returns (address);

    function getPositionTokenData() external view returns (OpiumPositionTokenParams memory opiumPositionTokenParams);
}
