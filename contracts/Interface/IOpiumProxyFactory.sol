
pragma solidity 0.8.5;

interface IOpiumProxyFactory {
    function getImplementationAddress() view external returns(address);
}