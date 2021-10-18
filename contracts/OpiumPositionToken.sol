pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./Lib/LibDerivative.sol";

contract OpiumPositionToken is ERC20Upgradeable {
    using LibDerivative for LibDerivative.Derivative;
    address private factory;
    struct OpiumPositionTokenParams {
        LibDerivative.Derivative derivative;
        LibDerivative.PositionType positionType;
        bytes32 derivativeHash;
    }
    OpiumPositionTokenParams private opiumPositionTokenParams;

    function initialize(
        LibDerivative.Derivative calldata _derivative,
        bytes32 _derivativeHash,
        LibDerivative.PositionType _positionType
    ) external initializer {
        _positionType == LibDerivative.PositionType.LONG
            ? __ERC20_init("OPIUM LONG TOKEN", "OPLN")
            : __ERC20_init("OPIUM SHORT TOKEN", "OPSH");
        factory = msg.sender;
        opiumPositionTokenParams = OpiumPositionTokenParams({
            derivative: _derivative,
            positionType: _positionType,
            derivativeHash: _derivativeHash
        });
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

    //GETTERS
    function getFactoryAddress() external view returns (address) {
        return factory;
    }

    function getPositionTokenData() external view returns (OpiumPositionTokenParams memory _opiumPositionTokenParams) {
        return opiumPositionTokenParams;
    }
}
