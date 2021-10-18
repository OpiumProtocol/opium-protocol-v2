pragma solidity 0.8.5;
import "../Lib/LibDerivative.sol";

interface IOpiumPositionToken {
    struct OpiumPositionTokenParams {
        LibDerivative.Derivative derivative;
        LibDerivative.PositionType positionType;
        bytes32 derivativeHash;
    }

    function initialize(
        LibDerivative.Derivative calldata _derivative,
        bytes32 _derivativeHash,
        LibDerivative.PositionType _positionType
    ) external;

    function mint(address _address, uint256 _amount) external;

    function burn(address _address, uint256 _amount) external;

    function getFactoryAddress() external view returns (address);

    function getPositionTokenData() external view returns (OpiumPositionTokenParams memory opiumPositionTokenParams);
}
