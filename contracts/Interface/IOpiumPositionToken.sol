pragma solidity 0.8.5;
interface IOpiumPositionToken {
    function initialize(string memory name, string memory symbol) external;
    function mint(address _address, uint256 _amount) external;
    function burn(address _address, uint256 _amount) external;
}