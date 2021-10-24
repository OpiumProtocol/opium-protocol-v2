pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Lib/LibDerivative.sol";
import "./Lib/LibPosition.sol";
import "./Interface/IOpiumPositionToken.sol";
import "./Interface/IRegistry.sol";
import "./OpiumPositionToken.sol";
import "hardhat/console.sol";

/**
    Error codes:
    - F1 = ERROR_OPIUM_PROXY_FACTORY_ALREADY_DEPLOYED
    - F2 = ERROR_OPIUM_PROXY_FACTORY_NOT_CORE
 */

/// @title Opium.OpiumProxyFactory contract manages the deployment of ERC20 LONG/SHORT positions for a given `LibDerivative.Derivative` structure and it's responsible for minting and burning positions according to the parameters supplied by `Opium.Core`
contract OpiumProxyFactory is Initializable {
    using LibDerivative for LibDerivative.Derivative;
    using LibPosition for bytes32;
    event LogShortPositionTokenAddress(bytes32 _derivativeHash, address indexed _positionAddress);
    event LogLongPositionTokenAddress(bytes32 _derivativeHash, address indexed _positionAddress);
    event LogMintShortPosition(address indexed _positionAddress, uint256 _amount);
    event LogMintLongPosition(address indexed _positionAddress, uint256 _amount);
    // event LogMintShortPosition(address indexed _positionAddress, uint256 _amount);
    // event LogMintLongPosition(address indexed _positionAddress, uint256 _amount);

    IRegistry private registry;

    address private opiumPositionTokenImplementation;

    /// @notice it restricts access to the consumer functions to the Opium.Core contract
    modifier onlyCore() {
        require(msg.sender == registry.getCore(), "F2");
        _;
    }

    /// @notice it is called only once upon deployment of the contract
    /// @dev it sets the the address of the implementation of the OpiumPositionToken contract which will be used for the factory-deployment of erc20 positions via the minimal proxy contract
    /// @param _registry address of Opium.Registry
    function initialize(address _registry) external initializer {
        opiumPositionTokenImplementation = address(new OpiumPositionToken());
        registry = IRegistry(_registry);
    }

    /// @notice read-only getter to retrieve the information about the underlying derivative
    /// @return _opiumPositionTokenParams OpiumPositionTokenParams struct which contains `LibDerivative.Derivative` schema of the derivative, the ` LibDerivative.PositionType` of the present ERC20 token and the bytes32 hash `derivativeHash` of the `LibDerivative.Derivative` derivative
    function getImplementationAddress() external view returns (address) {
        return opiumPositionTokenImplementation;
    }

    /// @notice checks whether a contract has already been deployed at a specific address
    /// @return bool true if a contract has been deployed at a specific address and false otherwise
    function _isContract(address _address) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_address)
        }
        return size > 0;
    }

    /// @notice it creates a specified amount of LONG/SHORT position tokens on behalf of the buyer(LONG) and seller(SHORT) - the specified amount can be 0 in which case the ERC20 contract of the position tokens will only be deployed
    /// @dev the ERC20 position token's address is calculated via create2 - if a contract already exists at the create2 address of either the LONG or SHORT position then the entire function reverts
    /// @param _buyer address of the recipient of the LONG position tokens
    /// @param _seller address of the recipient of the SHORT position tokens
    /// @param _amount amount of position tokens to be minted to the _positionHolder
    /// @param _derivativeHash bytes32 hash of `LibDerivative.Derivative`
    /// @param _derivative LibDerivative.Derivative Derivative definition
    function create(
        address _buyer,
        address _seller,
        uint256 _amount,
        bytes32 _derivativeHash,
        LibDerivative.Derivative calldata _derivative
    ) external onlyCore {
        address shortPositionAddress = _derivativeHash.deployOpiumPosition(false, opiumPositionTokenImplementation);
        address longPositionAddress = _derivativeHash.deployOpiumPosition(true, opiumPositionTokenImplementation);
        IOpiumPositionToken(longPositionAddress).initialize(
            _derivativeHash,
            LibDerivative.PositionType.LONG,
            _derivative
        );
        IOpiumPositionToken(shortPositionAddress).initialize(
            _derivativeHash,
            LibDerivative.PositionType.SHORT,
            _derivative
        );
        if (_amount > 0) {
            IOpiumPositionToken(longPositionAddress).mint(_buyer, _amount);
            IOpiumPositionToken(shortPositionAddress).mint(_seller, _amount);
            emit LogMintShortPosition(longPositionAddress, _amount);
            emit LogMintLongPosition(shortPositionAddress, _amount);
        }
        emit LogLongPositionTokenAddress(_derivativeHash, longPositionAddress);
        emit LogShortPositionTokenAddress(_derivativeHash, shortPositionAddress);
    }

    /// @notice it creates a specified amount of LONG/SHORT position tokens on behalf of the buyer(LONG) and seller(SHORT) - the specified amount can be 0 in which case the ERC20 contract of the position tokens will only be deployed
    /// @dev the ERC20 position token's address is calculated via create2 - if a contract already exists at the create2 address of either the LONG or SHORT position then the function reverts
    /// @param _buyer address of the recipient of the LONG position tokens
    /// @param _seller address of the recipient of the SHORT position tokens
    /// @param _longPositionAddress address of the deployed LONG position token
    /// @param _shortPositionAddress address of the deployed SHORT position token
    /// @param _amount amount of position tokens to be minted to the _positionHolder
    function mintPair(
        address _buyer,
        address _seller,
        address _longPositionAddress,
        address _shortPositionAddress,
        uint256 _amount
    ) external onlyCore {
        require(_isContract(_longPositionAddress) == true, "F1");
        require(_isContract(_shortPositionAddress) == true, "F1");
        IOpiumPositionToken(_longPositionAddress).mint(_buyer, _amount);
        IOpiumPositionToken(_shortPositionAddress).mint(_seller, _amount);
        // emit LogMintShortPosition(_longPositionAddress, _amount);
        // emit LogMintLongPosition(_shortPositionAddress, _amount);
    }

    /// @notice it burns specified amount of a specific position tokens on behalf of a specified owner
    /// @notice it is consumed by Opium.Core to execute or cancel a specific position type
    /// @dev the ERC20 position token's address is calculated via create2 - if a contract already exists at the create2 address of either the LONG or SHORT position then the entire function reverts
    /// @param _positionOwner address of the owner of the specified position token
    /// @param _positionAddress address of the position token to be burnt
    /// @param _amount amount of position tokens to be minted to the _positionHolder
    function burn(
        address _positionOwner,
        address _positionAddress,
        uint256 _amount
    ) external onlyCore {
        IOpiumPositionToken(_positionAddress).burn(_positionOwner, _amount);
    }

    /// @notice it burns specified amount of LONG/SHORT position tokens on behalf of a specified owner
    /// @notice it is consumed by Opium.Core to redeem market neutral position pairs
    /// @param _positionOwner address of the owner of the LONG/SHORT position tokens
    /// @param _longPositionAddress address of the deployed LONG position token
    /// @param _shortPositionAddress address of the deployed SHORT position token
    /// @param _amount amount of position tokens to be minted to the _positionHolder
    function burnPair(
        address _positionOwner,
        address _longPositionAddress,
        address _shortPositionAddress,
        uint256 _amount
    ) external onlyCore {
        IOpiumPositionToken(_longPositionAddress).burn(_positionOwner, _amount);
        IOpiumPositionToken(_shortPositionAddress).burn(_positionOwner, _amount);
    }
}
