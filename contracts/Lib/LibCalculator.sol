pragma solidity 0.8.5;

library LibCalculator {
    function mulWithPrecisionFactor(uint256 _precisionFactor, uint256 _x, uint256 _y) internal pure returns (uint256) {
        return (_x * _y) / _precisionFactor;
    }

    function modWithPrecisionFactor(uint256 _precisionFactor, uint256 _x) internal pure returns (uint256) {
        return _x % _precisionFactor;
    }
}
