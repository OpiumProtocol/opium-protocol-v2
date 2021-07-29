pragma solidity 0.5.16;

import "hardhat/console.sol";

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract OpiumPositionToken is ERC20Detailed, ERC20 {
    address public factory;
    constructor(string memory name, string memory symbol, uint8 decimals) public ERC20Detailed(name, symbol, decimals) {
        factory = msg.sender;
    }

    modifier isFactory() {
        require(msg.sender == factory, "NOT_FACTORY");
        _;
    }

    function mint(address _positionHolder, uint256 _quantity) external isFactory {
        _mint(_positionHolder, _quantity);
    }

    function burn(address _positionHolder, uint256 _quantity) external isFactory {
        _burn(_positionHolder, _quantity);
    }
}
