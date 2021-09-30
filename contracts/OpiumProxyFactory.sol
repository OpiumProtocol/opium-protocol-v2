pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/proxy/Clones.sol";

import "./OpiumPositionToken.sol";
import "./Interface/IOpiumPositionToken.sol";
import "./Lib/UsingRegistry.sol";
import "hardhat/console.sol";

contract OpiumProxyFactory is UsingRegistry {
    event LogShortPositionTokenAddress(address _positionAddress);
    event LogLongPositionTokenAddress(address _positionAddress);

    address private immutable opiumPositionTokenImplementation;
    string private constant longTokenName = "OPIUM LONG TOKEN";
    string private constant longTokenSymbol = "OPLN";
    string private constant shortTokenName = "OPIUM SHORT TOKEN";
    string private constant shortTokenSymbol = "OPSH";

    constructor(address _registry) {
        opiumPositionTokenImplementation = address(new OpiumPositionToken());
        __UsingRegistry__init__(_registry);
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

    function _computeDeploymentAddress(bytes32 _salt) private view returns (address) {
        return Clones.predictDeterministicAddress(opiumPositionTokenImplementation, _salt, address(this));
    }

    function _checkOrDeployPosition(bool _isLong, bytes32 _salt) private implementationAddressExists returns (address) {
        address opiumPositionAddress;
        opiumPositionAddress = _computeDeploymentAddress(_salt);
        if (!_isContract(opiumPositionAddress)) {
            opiumPositionAddress = Clones.cloneDeterministic(opiumPositionTokenImplementation, _salt);
            if (_isLong) {
                IOpiumPositionToken(opiumPositionAddress).initialize(longTokenName, longTokenSymbol);
                emit LogLongPositionTokenAddress(opiumPositionAddress);
            } else {
                IOpiumPositionToken(opiumPositionAddress).initialize(shortTokenName, shortTokenSymbol);
                emit LogShortPositionTokenAddress(opiumPositionAddress);
            }
        }
        return opiumPositionAddress;
    }

    function mint(
        address _buyer,
        address _seller,
        bytes32 _derivativeHash,
        uint256 _amount
    ) external onlyCore implementationAddressExists {
        bytes32 shortSalt = keccak256(abi.encodePacked(_derivativeHash, "SHORT"));
        bytes32 longSalt = keccak256(abi.encodePacked(_derivativeHash, "LONG"));

        address shortPositionAddress = _checkOrDeployPosition(false, shortSalt);
        address longPositionAddress = _checkOrDeployPosition(true, longSalt);

        IOpiumPositionToken(shortPositionAddress).mint(_seller, _amount);
        IOpiumPositionToken(longPositionAddress).mint(_buyer, _amount);
    }

    function burn(
        address _tokenOwner,
        address _token,
        uint256 _amount
    ) external onlyCore implementationAddressExists {
        IOpiumPositionToken(_token).burn(_tokenOwner, _amount);
    }
}
