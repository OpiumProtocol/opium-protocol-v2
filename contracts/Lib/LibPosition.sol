pragma solidity ^0.8.5;

import "openzeppelin-solidity/contracts/proxy/Clones.sol";

import "../OpiumPositionToken.sol";
import "../Interface/IOpiumProxyFactory.sol";

library LibPosition {
  function computeLongPositionAddress(bytes32 _derivativeHash, address _factoryAddress) internal view returns(address) {
    bytes32 salt = keccak256(abi.encodePacked( _derivativeHash, "LONG"));
    return Clones.predictDeterministicAddress(IOpiumProxyFactory(_factoryAddress).getImplementationAddress(), salt, _factoryAddress);
  }

  function computeShortPositionAddress(bytes32 _derivativeHash, address _factoryAddress) internal view returns(address) {
    bytes32 salt = keccak256(abi.encodePacked( _derivativeHash, "SHORT"));

    return Clones.predictDeterministicAddress(IOpiumProxyFactory(_factoryAddress).getImplementationAddress(), salt, _factoryAddress);
  }
}
