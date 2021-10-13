pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/proxy/Clones.sol";

import "./Lib/LibDerivative.sol";
import "./Lib/UsingRegistryACL.sol";
import "./Lib/LibPosition.sol";
import "./OpiumPositionToken.sol";
import "./Interface/IOpiumPositionToken.sol";

contract OpiumProxyFactory is UsingRegistryACL, LibDerivative {
    using LibPosition for bytes32;
    event LogShortPositionTokenAddress(bytes32 _derivativeHash, address indexed _positionAddress);
    event LogLongPositionTokenAddress(bytes32 _derivativeHash, address indexed _positionAddress);

    address private immutable opiumPositionTokenImplementation;
    string private constant longTokenName = "OPIUM LONG TOKEN";
    string private constant longTokenSymbol = "OPLN";
    string private constant shortTokenName = "OPIUM SHORT TOKEN";
    string private constant shortTokenSymbol = "OPSH";

    constructor(address _registry) {
        opiumPositionTokenImplementation = address(new OpiumPositionToken());
        __UsingRegistryACL__init(_registry);
    }

    modifier implementationAddressExists() {
        require(opiumPositionTokenImplementation != address(0), "IMPLEMENTATION_IS_NULL");
        _;
    }

    function getImplementationAddress() external view returns (address) {
        return opiumPositionTokenImplementation;
    }

    function _isContract(address _address) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_address)
        }
        return size > 0;
    }

    function _checkOrDeployPosition(
        bool _isLong,
        bytes32 _salt,
        bytes32 _derivativeHash,
        Derivative memory _derivative
    ) private implementationAddressExists returns (address) {
        address opiumPositionAddress;
        opiumPositionAddress = _salt.predictDeterministicAddress(opiumPositionTokenImplementation, address(this));
        if (!_isContract(opiumPositionAddress)) {
            opiumPositionAddress = Clones.cloneDeterministic(opiumPositionTokenImplementation, _salt);
            if (_isLong) {
                IOpiumPositionToken(opiumPositionAddress).initialize(
                    longTokenName,
                    longTokenSymbol,
                    _derivative,
                    _derivativeHash,
                    PositionType.LONG
                );
                emit LogLongPositionTokenAddress(_derivativeHash, opiumPositionAddress);
            } else {
                IOpiumPositionToken(opiumPositionAddress).initialize(
                    shortTokenName,
                    shortTokenSymbol,
                    _derivative,
                    _derivativeHash,
                    PositionType.SHORT
                );
                emit LogShortPositionTokenAddress(_derivativeHash, opiumPositionAddress);
            }
        }
        return opiumPositionAddress;
    }

    function mint(
        address _buyer,
        address _seller,
        bytes32 _derivativeHash,
        Derivative calldata _derivative,
        uint256 _amount
    ) external onlyCore implementationAddressExists whenNotPaused {
        bytes32 shortSalt = keccak256(abi.encodePacked(_derivativeHash, "SHORT"));
        bytes32 longSalt = keccak256(abi.encodePacked(_derivativeHash, "LONG"));

        address shortPositionAddress = _checkOrDeployPosition(false, shortSalt, _derivativeHash, _derivative);
        address longPositionAddress = _checkOrDeployPosition(true, longSalt, _derivativeHash, _derivative);

        IOpiumPositionToken(shortPositionAddress).mint(_seller, _amount);
        IOpiumPositionToken(longPositionAddress).mint(_buyer, _amount);
    }

    function burn(
        address _tokenOwner,
        address _token,
        uint256 _amount
    ) external onlyCore implementationAddressExists whenNotPaused {
        IOpiumPositionToken(_token).burn(_tokenOwner, _amount);
    }
}
