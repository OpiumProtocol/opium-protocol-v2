pragma solidity 0.8.5;

library LibCalculator {
    function mulWithPrecisionFactor(uint256 _x, uint256 _y) internal pure returns (uint256) {
        return (_x * _y) / 1e18;
    }

    function modWithPrecisionFactor(uint256 _x) internal pure returns (uint256) {
        return _x % 1e18;
    }

    function scaleBasisPointToAuthorBase(uint256 _x) internal pure returns (uint256) {
        return _x / 10000;
    }

    function scaleBasisPointToProtocolBase(uint256 _x) internal pure returns (uint256) {
        return _x / 10;
    }
}
