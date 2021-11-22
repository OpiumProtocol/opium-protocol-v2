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
    - F2 = ERROR_OPIUM_PROXY_CUSTOM_POSITION_TOKEN_NAME_TOO_LONG
 */

/// @title Opium.OpiumProxyFactory contract manages the deployment of ERC20 LONG/SHORT positions for a given `LibDerivative.Derivative` structure and it's responsible for minting and burning positions according to the parameters supplied by `Opium.Core`
contract OpiumProxyFactory is RegistryManager {
    using LibDerivative for LibDerivative.Derivative;
    using LibPosition for bytes32;
    event LogShortPositionTokenAddress(bytes32 indexed _derivativeHash, address indexed _positionAddress);
    event LogLongPositionTokenAddress(bytes32 indexed _derivativeHash, address indexed _positionAddress);

    address private opiumPositionTokenImplementation;

    /// @notice It is applied to functions that must be called only by the `Opium.Core` contract
    modifier onlyCore() {
        require(msg.sender == registry.getCore(), "F1");
        _;
    }

    // ****************** EXTERNAL FUNCTIONS ******************

    // ***** GETTERS *****

    /// @notice It retrieves the information about the underlying derivative
    /// @return _opiumPositionTokenParams OpiumPositionTokenParams struct which contains `LibDerivative.Derivative` schema of the derivative, the ` LibDerivative.PositionType` of the present ERC20 token and the bytes32 hash `derivativeHash` of the `LibDerivative.Derivative` derivative
    function getImplementationAddress() external view returns (address) {
        return opiumPositionTokenImplementation;
    }

    // ***** SETTERS *****

    /// @notice It is called only once upon deployment of the contract
    /// @dev It sets the the address of the implementation of the OpiumPositionToken contract which will be used for the factory-deployment of erc20 positions via the minimal proxy contract
    /// @param _registry address of Opium.Registry
    function initialize(address _registry) external initializer {
        __RegistryManager__init(_registry);
        opiumPositionTokenImplementation = address(new OpiumPositionToken());
    }

    /// @notice It creates a specified amount of LONG/SHORT position tokens on behalf of the buyer(LONG) and seller(SHORT) - the specified amount can be 0 in which case the ERC20 contract of the position tokens will only be deployed
    /// @dev if either of the LONG or SHORT position contracts already exists then it is expected to fail
    /// @param _buyer address of the recipient of the LONG position tokens
    /// @param _seller address of the recipient of the SHORT position tokens
    /// @param _amount amount of position tokens to be minted to the _positionHolder
    /// @param _derivativeHash bytes32 hash of `LibDerivative.Derivative`
    /// @param _derivative LibDerivative.Derivative Derivative definition
    /// @param _derivativeAuthorCustomName derivative author's custom derivative position name to be used as a part of the OpiumPositionToken erc20 name
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
    /// @dev if LONG or SHORT position contracts have not been deployed yet at the provided addresses then it is expected to fail
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
    /// @dev if no position has been deployed at the provided address, it is expected to revert
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

    /// @notice It burns the specified amount of LONG/SHORT position tokens on behalf of a specified owner
    /// @notice It is consumed by Opium.Core to redeem market neutral position pairs
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

    // ****************** PRIVATE FUNCTIONS ******************

    // ***** SETTERS *****

    /// @notice It is used to obtain a slice of derivativeHash and convert it to a string to be used as part of an Opium position token's name
    /// @param _data bytes32 representing a derivativeHash
    /// @return string representing the first 4 characters of a derivativeHash prefixed by "0x"
    function _toDerivativeHashStringIdentifier(bytes32 _data) private pure returns (string memory) {
        bytes4 result;
        assembly {
            result := or(
                and(
                    or(
                        shr(4, and(_data, 0xF000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000)),
                        shr(8, and(_data, 0x0F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F00))
                    ),
                    0xffff000000000000000000000000000000000000000000000000000000000000
                ),
                shr(
                    16,
                    or(
                        shr(4, and(shl(8, _data), 0xF000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000)),
                        shr(8, and(shl(8, _data), 0x0F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F00))
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

    /// @notice It is used to convert a derivative.endTime to a human-readable date to be used as part of an Opium position token's name
    /// @dev { See the third-party library ./libs/LibBokkyPooBahsDateTimeLibrary.sol }
    /// @param _derivativeEndTime uint256 representing the timestamp of a given derivative's maturity
    /// @return bytes representing the encoding of the derivativeEndTime converted to day-month-year in the format DD/MM/YYYY
    function _toDerivativeEndTimeIdentifier(uint256 _derivativeEndTime) private pure returns (bytes memory) {
        (uint256 year, uint256 month, uint256 day) = BokkyPooBahsDateTimeLibrary.timestampToDate(_derivativeEndTime);

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
