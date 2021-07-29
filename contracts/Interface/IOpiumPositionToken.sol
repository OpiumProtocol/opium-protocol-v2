pragma solidity 0.5.16;
interface IOpiumPositionToken {
    function mint(address _address, uint256 _quantity) external;
    function burn(address _address, uint256 _quantity) external;
}