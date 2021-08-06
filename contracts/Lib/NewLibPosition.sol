pragma solidity ^0.5.4;
import "../OpiumPositionToken.sol";

library NewLibPosition {

  function _getCreationBytecode(string memory name, string memory symbol, uint8 decimals) private pure returns(bytes memory) {
      bytes memory bytecode = type(OpiumPositionToken).creationCode;
      return abi.encodePacked(bytecode, abi.encode(name,symbol, decimals));
  }

  // function computeDeploymentAddress(bytes32 _derivativeHash, positionType _positionType) external view returns(address) {
  //     bytes memory positionBytecode;
  //     if(_positionType == positionType.SHORT) {
  //       positionBytecode = _getCreationBytecod("SHORT", "SHORT", 18);
  //     }
  //     else if(_positionType == positionType.LONG) {
  //       positionBytecode = _getCreationBytecode("LONG","LONG", 18);
  //     } else {
  //       revert("unknown position");
  //     }
  //     bytes32 salt = keccak256(abi.encodePacked(_derivativeHash));
  //     return address(uint(keccak256(abi.encodePacke(hex'ff', address(this), _salt, keccak25(_bytecode)))));
  //   }

  
  function computeLongPositionAddress(bytes32 _derivativeHash, address _factoryAddress) external view returns(address) {
      bytes memory positionBytecode = _getCreationBytecode("LONG", "LONG", 18);
      bytes32 salt = keccak256(abi.encodePacked(_derivativeHash));
      return address(uint(keccak256(abi.encodePacked(hex'ff', address(_factoryAddress), salt, keccak256(positionBytecode)))));
  }

  function computeShortPositionAddress(bytes32 _derivativeHash, address _factoryAddress) external view returns(address) {
      bytes memory positionBytecode = _getCreationBytecode("SHORT", "SHORT", 18);
      bytes32 salt = keccak256(abi.encodePacked(_derivativeHash));
      return address(uint(keccak256(abi.encodePacked(hex'ff', address(_factoryAddress), salt, keccak256(positionBytecode)))));
  }
}
