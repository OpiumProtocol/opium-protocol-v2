pragma solidity 0.8.5;
interface IOpiumPositionToken {
    function mint(address _address, uint256 _quantity) external;
    function burn(address _address, uint256 _quantity) external;
}