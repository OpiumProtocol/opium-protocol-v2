pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "hardhat/console.sol";

contract OpiumPositionToken is ERC20Upgradeable {
    address public factory;

    function initialize(string memory name, string memory symbol) public initializer {
        factory = msg.sender;
        __ERC20_init(name, symbol);
    }

    modifier isFactory() {
        require(factory != address(0), "FACTORY_IS_NULL");
        require(msg.sender == factory, "NOT_FACTORY");
        _;
    }

    function mint(address _positionHolder, uint256 _amount) external isFactory {
        _mint(_positionHolder, _amount);
    }

    function burn(address _positionHolder, uint256 _amount) external isFactory {
        _burn(_positionHolder, _amount);
    }
}
