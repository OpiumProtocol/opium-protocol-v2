pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "../libs/LibDerivative.sol";
import "hardhat/console.sol";

/**
    Error codes:
    - P1 = ERROR_OPIUM_POSITION_TOKEN_NOT_FACTORY
 */

/// @title Opium.OpiumPositionToken is Opium.OpiumProxyFactory's child contract. It inherits of ERC20Upgradeable and represents a specific position (either LONG or SHORT) for a given `LibDerivative.Derivative` derivative
contract OpiumPositionToken is ERC20PermitUpgradeable {
    using LibDerivative for LibDerivative.Derivative;

    address private factory;

    struct OpiumPositionTokenParams {
        LibDerivative.Derivative derivative;
        LibDerivative.PositionType positionType;
        bytes32 derivativeHash;
    }

    OpiumPositionTokenParams private opiumPositionTokenParams;

    /// @notice `it is called only once upon deployment of the contract
    /// @dev it sets the state variables that are meant to be read-only and should be consumed by other contracts to retrieve information about the derivative
    /// @param _derivativeHash bytes32 hash of `LibDerivative.Derivative`
    /// @param _positionType  LibDerivative.PositionType _positionType describes whether the present ERC20 token is SHORT or LONG
    /// @param _derivative LibDerivative.Derivative Derivative definition
    function initialize(
        bytes32 _derivativeHash,
        LibDerivative.PositionType _positionType,
        LibDerivative.Derivative calldata _derivative
    ) external initializer {
        if (_positionType == LibDerivative.PositionType.LONG) {
            __ERC20_init("OPIUM LONG TOKEN", "OPLN");
            __ERC20Permit_init("OPIUM LONG TOKEN");
        } else {
            __ERC20_init("OPIUM SHORT TOKEN", "OPSH");
            __ERC20Permit_init("OPIUM SHORT TOKEN");
        }
        factory = msg.sender;
        opiumPositionTokenParams = OpiumPositionTokenParams({
            derivative: _derivative,
            positionType: _positionType,
            derivativeHash: _derivativeHash
        });
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "P1");
        _;
    }

    /// @notice it mints a specified amount of tokens to the given address
    /// @dev can only be called by the factory contract set in the `initialize` function
    /// @param _positionHolder address of the recipient of the position tokens
    /// @param _amount amount of position tokens to be minted to the _positionHolder
    function mint(address _positionHolder, uint256 _amount) external onlyFactory {
        _mint(_positionHolder, _amount);
    }

    /// @notice it burns a specified amount of tokens owned by the given address
    /// @dev can only be called by the factory contract set in the `initialize` function
    /// @param _positionHolder address of the owner of the position tokens
    /// @param _amount amount of position tokens to be burnt
    function burn(address _positionHolder, uint256 _amount) external onlyFactory {
        _burn(_positionHolder, _amount);
    }

    //GETTERS

    /// @notice read-only getter to retrieve the address of the factory contract set in the `initialize` function
    /// @return address of factory contract (OpiumProxyFactory)
    function getFactoryAddress() external view returns (address) {
        return factory;
    }

    /// @notice read-only getter to retrieve the information about the underlying derivative
    /// @return _opiumPositionTokenParams OpiumPositionTokenParams struct which contains `LibDerivative.Derivative` schema of the derivative, the `LibDerivative.PositionType` of the present ERC20 token and the bytes32 hash `derivativeHash` of the `LibDerivative.Derivative` derivative
    function getPositionTokenData() external view returns (OpiumPositionTokenParams memory _opiumPositionTokenParams) {
        return opiumPositionTokenParams;
    }
}
