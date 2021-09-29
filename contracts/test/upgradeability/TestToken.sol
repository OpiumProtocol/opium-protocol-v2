pragma solidity 0.8.5;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    address public owner;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        owner = msg.sender;
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address _to, uint256 _amount) public {
        require(msg.sender == owner, "Only owner can mint");
        _mint(_to, _amount);
    }
}
