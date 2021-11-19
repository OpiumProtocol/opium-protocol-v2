pragma solidity 0.8.5;
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "./OpiumPositionToken.sol";
import "./base/RegistryManager.sol";
import "../libs/LibDerivative.sol";
import "../libs/LibPosition.sol";
import "../libs/LibBokkyPooBahsDateTimeLibrary.sol";
import "../interfaces/IOpiumPositionToken.sol";
import "../interfaces/IRegistry.sol";
import "hardhat/console.sol";

/**
    Error codes:
    - F1 = ERROR_OPIUM_PROXY_FACTORY_NOT_CORE
    - F2 = ERROR_OPIUM_PROXY_CUSTOM_DERIVATIVE_NAME_TOO_LONG
 */

/// @title Opium.OpiumProxyFactory contract manages the deployment of ERC20 LONG/SHORT positions for a given `LibDerivative.Derivative` structure and it's responsible for minting and burning positions according to the parameters supplied by `Opium.Core`
contract OpiumProxyFactory is RegistryManager {
    using LibDerivative for LibDerivative.Derivative;
    using LibPosition for bytes32;
    event LogShortPositionTokenAddress(bytes32 indexed _derivativeHash, address indexed _positionAddress);
    event LogLongPositionTokenAddress(bytes32 indexed _derivativeHash, address indexed _positionAddress);

    address private opiumPositionTokenImplementation;

    /// @notice it restricts access to the consumer functions to the Opium.Core contract
    modifier onlyCore() {
        require(msg.sender == registry.getCore(), "F1");
        _;
    }

    // ****************** EXTERNAL FUNCTIONS ******************

    /// @notice it is called only once upon deployment of the contract
    /// @dev it sets the the address of the implementation of the OpiumPositionToken contract which will be used for the factory-deployment of erc20 positions via the minimal proxy contract
    /// @param _registry address of Opium.Registry
    function initialize(address _registry) external initializer {
        __RegistryManager__init(_registry);
        opiumPositionTokenImplementation = address(new OpiumPositionToken());
    }

    /// @notice read-only getter to retrieve the information about the underlying derivative
    /// @return _opiumPositionTokenParams OpiumPositionTokenParams struct which contains `LibDerivative.Derivative` schema of the derivative, the ` LibDerivative.PositionType` of the present ERC20 token and the bytes32 hash `derivativeHash` of the `LibDerivative.Derivative` derivative
    function getImplementationAddress() external view returns (address) {
        return opiumPositionTokenImplementation;
    }

    /// @notice it creates a specified amount of LONG/SHORT position tokens on behalf of the buyer(LONG) and seller(SHORT) - the specified amount can be 0 in which case the ERC20 contract of the position tokens will only be deployed
    /// @dev the ERC20 position token's address is calculated via create2 - if a contract already exists at the create2 address of either the LONG or SHORT position then the entire function reverts
    /// @param _buyer address of the recipient of the LONG position tokens
    /// @param _seller address of the recipient of the SHORT position tokens
    /// @param _amount amount of position tokens to be minted to the _positionHolder
    /// @param _derivativeHash bytes32 hash of `LibDerivative.Derivative`
    /// @param _derivative LibDerivative.Derivative Derivative definition
    /// @param _derivativeAuthorCustomName derivative author's custom derivative name
    function create(
        address _buyer,
        address _seller,
        uint256 _amount,
        bytes32 _derivativeHash,
        LibDerivative.Derivative calldata _derivative,
        string calldata _derivativeAuthorCustomName
    ) external onlyCore {
        require(bytes(_derivativeAuthorCustomName).length < 30, "F2");
        address longPositionAddress = _derivativeHash.deployOpiumPosition(true, opiumPositionTokenImplementation);
        address shortPositionAddress = _derivativeHash.deployOpiumPosition(false, opiumPositionTokenImplementation);

        bytes memory baseCustomName = abi.encodePacked(
            _toDerivativeEndTimeIdentifier(_derivative.endTime),
            "-",
            _derivativeAuthorCustomName,
            "-",
            _toDerivativeHashStringIdentifier(_derivativeHash)
        );

        IOpiumPositionToken(longPositionAddress).initialize(
            _derivativeHash,
            LibDerivative.PositionType.LONG,
            _derivative,
            baseCustomName
        );
        IOpiumPositionToken(shortPositionAddress).initialize(
            _derivativeHash,
            LibDerivative.PositionType.SHORT,
            _derivative,
            baseCustomName
        );
        emit LogLongPositionTokenAddress(_derivativeHash, longPositionAddress);
        emit LogShortPositionTokenAddress(_derivativeHash, shortPositionAddress);
        if (_amount > 0) {
            IOpiumPositionToken(longPositionAddress).mint(_buyer, _amount);
            IOpiumPositionToken(shortPositionAddress).mint(_seller, _amount);
        }
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
        IOpiumPositionToken(_longPositionAddress).mint(_buyer, _amount);
        IOpiumPositionToken(_shortPositionAddress).mint(_seller, _amount);
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

    function _toDerivativeHashStringIdentifier(bytes32 data) private pure returns (string memory) {
        bytes4 result;
        assembly {
            result := or(
                and(
                    or(
                        shr(4, and(data, 0xF000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000)),
                        shr(8, and(data, 0x0F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F00))
                    ),
                    0xffff000000000000000000000000000000000000000000000000000000000000
                ),
                shr(
                    16,
                    or(
                        shr(4, and(shl(8, data), 0xF000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000)),
                        shr(8, and(shl(8, data), 0x0F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F00))
                    )
                )
            )
        }

        return
            string(
                abi.encodePacked(
                    "0x",
                    bytes4(0x30303030 + uint32(result) + (((uint32(result) + 0x06060606) >> 4) & 0x0F0F0F0F) * 7)
                )
            );
    }

    function _toDerivativeEndTimeIdentifier(uint256 derivativeEndTime) private pure returns (bytes memory) {
        (uint256 year, uint256 month, uint256 day) = BokkyPooBahsDateTimeLibrary.timestampToDate(derivativeEndTime);

        return
            abi.encodePacked(
                day < 10
                    ? abi.encodePacked("0", StringsUpgradeable.toString(day))
                    : bytes(StringsUpgradeable.toString(day)),
                "/",
                month < 10
                    ? abi.encodePacked("0", StringsUpgradeable.toString(month))
                    : bytes(StringsUpgradeable.toString(month)),
                "/",
                StringsUpgradeable.toString(year)
            );
    }
}
