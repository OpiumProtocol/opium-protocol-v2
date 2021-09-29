pragma solidity 0.8.5;

interface IOpiumProxyFactory {
    function getImplementationAddress() external view returns (address);
}
