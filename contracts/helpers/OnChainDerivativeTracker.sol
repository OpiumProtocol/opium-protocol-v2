// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../libs/LibPosition.sol";
import "../interfaces/IRegistry.sol";
import "../interfaces/IOpiumProxyFactory.sol";
import "../interfaces/IOpiumPositionToken.sol";

interface IERC20Extended is IERC20 {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);
}

struct PositionTotalSupply {
    address positionAddress;
    string name;
    string symbol;
    uint256 totalSupply;
    LibDerivative.Derivative derivative;
    bool isLong;
}

contract OnChainDerivativeTracker {
    using LibPosition for bytes32;

    IRegistry public immutable registry;

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    function getDerivativePositionsSupply(bytes32 _derivativeHash)
        external
        view
        returns (PositionTotalSupply[2] memory)
    {
        return _getDerivativePositionsSupply(_derivativeHash);
    }

    function getDerivativesPositionsSupply(bytes32[] calldata _derivativesHash)
        external
        view
        returns (PositionTotalSupply[2][] memory)
    {
        PositionTotalSupply[2][] memory positionsTotalSupply = new PositionTotalSupply[2][](_derivativesHash.length);
        for (uint256 i = 0; i < _derivativesHash.length; i++) {
            positionsTotalSupply[i] = _getDerivativePositionsSupply(_derivativesHash[i]);
        }
        return positionsTotalSupply;
    }

    function _getDerivativePositionsSupply(bytes32 _derivativeHash)
        private
        view
        returns (PositionTotalSupply[2] memory)
    {
        IOpiumProxyFactory opiumProxyFactory = IOpiumProxyFactory(registry.getProtocolAddresses().opiumProxyFactory);

        address longPositionAddress = _derivativeHash.predictDeterministicAddress(
            true,
            opiumProxyFactory.getImplementationAddress(),
            address(opiumProxyFactory)
        );
        address shortPositionAddress = _derivativeHash.predictDeterministicAddress(
            false,
            opiumProxyFactory.getImplementationAddress(),
            address(opiumProxyFactory)
        );

        return [
            PositionTotalSupply({
                positionAddress: longPositionAddress,
                name: IERC20Extended(longPositionAddress).name(),
                symbol: IERC20Extended(longPositionAddress).symbol(),
                totalSupply: IERC20Extended(longPositionAddress).totalSupply(),
                derivative: IOpiumPositionToken(longPositionAddress).getPositionTokenData().derivative,
                isLong: true
            }),
            PositionTotalSupply({
                positionAddress: shortPositionAddress,
                name: IERC20Extended(shortPositionAddress).name(),
                symbol: IERC20Extended(shortPositionAddress).symbol(),
                totalSupply: IERC20Extended(shortPositionAddress).totalSupply(),
                derivative: IOpiumPositionToken(shortPositionAddress).getPositionTokenData().derivative,
                isLong: false
            })
        ];
    }
}
