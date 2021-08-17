pragma solidity 0.8.5;

import "./Lib/UsingRegistry.sol";
import "./OpiumPositionToken.sol";
import "./Interface/IOpiumPositionToken.sol";

contract OpiumProxyFactory {
    event LogPositionTokenAddress(address _positionAddress);

    function _isContract(address _address) private view returns(bool) {
        uint size;
        assembly {
            size := extcodesize(_address)
        }
        return size > 0;
    }

    function _computeDeploymentAddress(bytes32 _salt, bytes memory _bytecode) private view returns(address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(hex'ff', address(this), _salt, keccak256(_bytecode))))));
    }

    function _getCreationBytecode(string memory name, string memory symbol, uint8 decimals) private pure returns(bytes memory) {
        bytes memory bytecode = type(OpiumPositionToken).creationCode;
        return abi.encodePacked(bytecode, abi.encode(name, symbol, decimals));
    }

    function _checkOrDeployPosition(bytes32 _salt, bytes memory _bytecode) private returns(address) {
        address opiumPositionAddress;
        opiumPositionAddress = _computeDeploymentAddress(_salt, _bytecode);
        if(!_isContract(opiumPositionAddress)) {
            assembly {
                opiumPositionAddress := create2(0, add(_bytecode, 32), mload(_bytecode), _salt)
            }
        }
        return opiumPositionAddress;
    }

    function mint(address _buyer, address _seller, bytes32 _derivativeHash, uint256 _quantity) external {
        bytes memory shortPositionBytecode = _getCreationBytecode("SHORT", "SHORT", 18);
        bytes memory longPositionBytecode = _getCreationBytecode("LONG", "LONG", 18);
        bytes32 salt = keccak256(abi.encodePacked( _derivativeHash));
        address shortPositionAddress = _checkOrDeployPosition(salt, shortPositionBytecode);
        address longPositionAddress = _checkOrDeployPosition(salt, longPositionBytecode);

        emit LogPositionTokenAddress(shortPositionAddress);
        emit LogPositionTokenAddress(longPositionAddress);

        IOpiumPositionToken(shortPositionAddress).mint(_seller, _quantity);
        IOpiumPositionToken(longPositionAddress).mint(_buyer, _quantity);
    }

    function burn(address _tokenOwner, address _token, uint256 _quantity) external {
        IOpiumPositionToken(_token).burn(_tokenOwner,  _quantity);   
    }
}
