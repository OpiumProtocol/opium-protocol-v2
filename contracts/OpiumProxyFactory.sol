pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/proxy/Clones.sol";

import "./OpiumPositionToken.sol";
import "./Interface/IOpiumPositionToken.sol";


contract OpiumProxyFactory {
    event LogPositionTokenAddress(address _positionAddress);

    address immutable opiumPositionTokenImplementation;

    constructor() {
        opiumPositionTokenImplementation = address(new OpiumPositionToken());
    }

    modifier implementationAddressExists() {
        require(opiumPositionTokenImplementation != address(0), "IMPLEMENTATION_IS_NULL");
        _;
    }

    function getImplementationAddress() view external returns(address) {
        return opiumPositionTokenImplementation;
    }

    function _isContract(address _address) private view returns(bool) {
        uint size;
        assembly {
            size := extcodesize(_address)
        }
        return size > 0;
    }

    function _computeDeploymentAddress(bytes32 _salt) private view returns(address) {
        return Clones.predictDeterministicAddress(opiumPositionTokenImplementation, _salt, address(this));
    }

    function _checkOrDeployPosition(bool _isLong, bytes32 _salt) private implementationAddressExists() returns(address) {
        address opiumPositionAddress;
        opiumPositionAddress = _computeDeploymentAddress(_salt);
        if(!_isContract(opiumPositionAddress)) {
            opiumPositionAddress = Clones.cloneDeterministic(opiumPositionTokenImplementation, _salt);
            _isLong ?  IOpiumPositionToken(opiumPositionAddress).initialize("LONG", "LONG") : IOpiumPositionToken(opiumPositionAddress).initialize("SHORT", "SHORT");
        }
        return opiumPositionAddress;
    }

    function mint(address _buyer, address _seller, bytes32 _derivativeHash, uint256 _quantity) external implementationAddressExists() {
        bytes32 shortSalt = keccak256(abi.encodePacked( _derivativeHash, "SHORT"));
        bytes32 longSalt = keccak256(abi.encodePacked( _derivativeHash, "LONG"));

        address shortPositionAddress = _checkOrDeployPosition(false, shortSalt);
        address longPositionAddress = _checkOrDeployPosition(true, longSalt);

        emit LogPositionTokenAddress(shortPositionAddress);
        emit LogPositionTokenAddress(longPositionAddress);

        IOpiumPositionToken(shortPositionAddress).mint(_seller, _quantity);
        IOpiumPositionToken(longPositionAddress).mint(_buyer, _quantity);
    }

    function burn(address _tokenOwner, address _token, uint256 _quantity) external implementationAddressExists() {
        IOpiumPositionToken(_token).burn(_tokenOwner,  _quantity);   
    }
}
