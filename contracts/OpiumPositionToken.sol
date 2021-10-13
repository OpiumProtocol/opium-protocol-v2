pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./Lib/LibDerivative.sol";

contract OpiumPositionToken is ERC20Upgradeable, LibDerivative {
    address private factory;
    Derivative private derivative;
    bytes32 private derivativeHash;
    PositionType private positionType;

    function initialize(
        string memory name,
        string memory symbol,
        Derivative calldata _derivative,
        bytes32 _derivativeHash,
        PositionType _positionType
    ) external initializer {
        __ERC20_init(name, symbol);
        factory = msg.sender;
        derivative = _derivative;
        derivativeHash = _derivativeHash;
        positionType = _positionType;
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

    function getPositionType() external view returns (LibDerivative.PositionType) {
        return positionType;
    }

    function getDerivative() external view returns (Derivative memory _derivative) {
        return derivative;
    }

    function getFactoryAddress() external view returns (address) {
        return factory;
    }

    function getDerivativeHash() external view returns (bytes32) {
        return derivativeHash;
    }
}
