pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./Lib/LibDerivative.sol";

/**
    Error codes:
    - P1 = ERROR_OPIUM_POSITION_TOKEN_NOT_FACTORY
 */

/// @title Opium.OpiumPositionToken is Opium.OpiumProxyFactory's child contract. It inherits of ERC20Upgradeable and represents a specific position (either LONG or SHORT) for a given `LibDerivative.Derivative` derivative
contract OpiumPositionToken is ERC20Upgradeable {
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
        // string memory addressToString = toAsciiString(address(this));
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

    function toAsciiString(address x) private view returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal view returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
