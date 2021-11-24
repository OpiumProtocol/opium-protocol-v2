pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "../libs/LibDerivative.sol";
import "hardhat/console.sol";

/**
    Error codes:
    - P1 = ERROR_OPIUM_POSITION_TOKEN_NOT_FACTORY
 */

/// @title Opium.OpiumPositionToken is an ERC20PermitUpgradeable child contract created by the Opium.OpiumProxyFactory. It represents a specific position (either LONG or SHORT) for a given `LibDerivative.Derivative` derivative
contract OpiumPositionToken is ERC20PermitUpgradeable {
    using LibDerivative for LibDerivative.Derivative;

    address private factory;

    /// It describes the derivative whose position (either LONG or SHORT) is being represented by the OpiumPositionToken
    struct OpiumPositionTokenParams {
        LibDerivative.Derivative derivative;
        LibDerivative.PositionType positionType;
        bytes32 derivativeHash;
    }

    OpiumPositionTokenParams private opiumPositionTokenParams;

    /// @notice It is applied to all the stateful functions in OpiumPositionToken as they are meant to be consumed only via the OpiumProxyFactory
    modifier onlyFactory() {
        require(msg.sender == factory, "P1");
        _;
    }

    // ****************** EXTERNAL FUNCTIONS ******************

    // ***** SETTERS *****

    /// @notice `it is called only once upon deployment of the contract
    /// @dev it sets the state variables that are meant to be read-only and should be consumed by other contracts to retrieve information about the derivative
    /// @param _derivativeHash bytes32 hash of `LibDerivative.Derivative`
    /// @param _positionType  LibDerivative.PositionType _positionType describes whether the present ERC20 token is LONG or SHORT
    /// @param _derivative LibDerivative.Derivative Derivative definition
    /// @param _baseCustomName bytes representing the base to be used as the erc20 name after suffixing the position type of the token
    function initialize(
        bytes32 _derivativeHash,
        LibDerivative.PositionType _positionType,
        LibDerivative.Derivative calldata _derivative,
        bytes memory _baseCustomName
    ) external initializer {
        if (_positionType == LibDerivative.PositionType.LONG) {
            string memory longPositionName = string(abi.encodePacked(_baseCustomName, "-LONG"));
            __ERC20_init(longPositionName, "OPLN");
            __ERC20Permit_init(longPositionName);
        } else {
            string memory shortPositionName = string(abi.encodePacked(_baseCustomName, "-SHORT"));
            __ERC20_init(shortPositionName, "OPSH");
            __ERC20Permit_init(shortPositionName);
        }
        factory = msg.sender;
        opiumPositionTokenParams = OpiumPositionTokenParams({
            derivative: _derivative,
            positionType: _positionType,
            derivativeHash: _derivativeHash
        });
    }

    /// @notice it mints a specified amount of tokens to the given address
    /// @dev can only be called by the factory contract set in the `initialize` function
    /// @param _positionOwner address of the recipient of the position tokens
    /// @param _amount amount of position tokens to be minted to the _positionOwner
    function mint(address _positionOwner, uint256 _amount) external onlyFactory {
        _mint(_positionOwner, _amount);
    }

    /// @notice it burns a specified amount of tokens owned by the given address
    /// @dev can only be called by the factory contract set in the `initialize` function
    /// @param _positionOwner address of the owner of the position tokens
    /// @param _amount amount of position tokens to be burnt
    function burn(address _positionOwner, uint256 _amount) external onlyFactory {
        _burn(_positionOwner, _amount);
    }

    // ***** GETTERS *****

    /// @notice It retrieves the address of the factory contract set in the `initialize` function
    /// @return address of the factory contract (OpiumProxyFactory)
    function getFactoryAddress() external view returns (address) {
        return factory;
    }

    /// @notice It retrieves all the stored information about the underlying derivative
    /// @return _opiumPositionTokenParams OpiumPositionTokenParams struct which contains `LibDerivative.Derivative` schema of the derivative, the `LibDerivative.PositionType` of the present ERC20 token and the bytes32 hash `derivativeHash` of the `LibDerivative.Derivative` derivative
    function getPositionTokenData() external view returns (OpiumPositionTokenParams memory _opiumPositionTokenParams) {
        return opiumPositionTokenParams;
    }

   // Reserved storage space to allow for layout changes in the future.
   // The gaps left for the `OpiumPositionToken` are less than the slots allocated for the other upgradeable contracts in the protocol because the OpiumPositionToken is the only contract that is programmatically deployed (frequently), hence we want to minimize the gas cost
   uint256[30] private __gap;
}
