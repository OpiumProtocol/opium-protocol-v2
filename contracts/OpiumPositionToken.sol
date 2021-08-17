pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract OpiumPositionToken is ERC20 {
    address public factory;
    constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name, symbol) {
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
