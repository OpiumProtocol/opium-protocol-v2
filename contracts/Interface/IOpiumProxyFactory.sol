pragma solidity 0.8.5;
import "../Lib/LibDerivative.sol";

interface IOpiumProxyFactory {
    function getImplementationAddress() external view returns (address);

    function burnPair(
        address _tokenOwner,
        address _longToken,
        address _shortToken,
        uint256 _amount
    ) external;

    function burn(
        address _tokenOwner,
        address _token,
        uint256 _amount
    ) external;

    function mint(
        address _buyer,
        address _seller,
        bytes32 _derivativeHash,
        LibDerivative.Derivative calldata _derivative,
        uint256 _amount
    ) external;
}
