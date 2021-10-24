pragma solidity ^0.8.5;

import "openzeppelin-solidity/contracts/proxy/Clones.sol";

library LibPosition {
  function predictDeterministicAddress(
    bytes32 _derivativeHash,
    bool _isLong, 
    address _positionImplementationAddress, 
    address _factoryAddress
  ) internal pure returns(address) {
    bytes32 salt = keccak256(abi.encodePacked( _derivativeHash, _isLong ? "L" : "S"));
    return Clones.predictDeterministicAddress(_positionImplementationAddress, salt, _factoryAddress);
  }

  function deployOpiumPosition(
    bytes32 _derivativeHash, 
    bool _isLong,
    address _positionImplementationAddress
  ) internal returns(address) {
    bytes32 salt = keccak256(abi.encodePacked( _derivativeHash, _isLong ? "L" : "S"));
    return Clones.cloneDeterministic(_positionImplementationAddress, salt);
  }
}
