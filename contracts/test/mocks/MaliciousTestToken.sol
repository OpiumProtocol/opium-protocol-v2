// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../../libs/LibDerivative.sol";
import "../../libs/LibPosition.sol";

contract MaliciousTestToken is ERC20 {
    address public owner;
    uint8 private customDecimals;

    struct OpiumPositionTokenParams {
        LibDerivative.Derivative derivative;
        LibDerivative.PositionType positionType;
        bytes32 derivativeHash;
    }

    OpiumPositionTokenParams private opiumPositionTokenParams;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        owner = msg.sender;
        customDecimals = _decimals;
        _mint(msg.sender, 100e12 * 10**customDecimals);
    }

    function mint(address _to, uint256 _amount) public {
        require(msg.sender == owner, "Only owner can mint");
        _mint(_to, _amount);
    }

    function decimals() public view override returns (uint8) {
        return customDecimals;
    }

    function getPositionTokenData() external view returns (OpiumPositionTokenParams memory opiumPositionTokenParams) {}
}
