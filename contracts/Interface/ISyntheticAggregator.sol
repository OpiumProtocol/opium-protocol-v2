pragma solidity 0.8.5;
import "../Lib/LibDerivative.sol";

interface ISyntheticAggregator {
    struct SyntheticCache {
        uint256 buyerMargin;
        uint256 sellerMargin;
        uint256 commission; // rename it to author commission for clarity
        address authorAddress;
        bool init;
        // SyntheticTypes typeByHash;
    }

    function getSyntheticCache(bytes32 _derivativeHash, LibDerivative.Derivative calldata _derivative)
        external
        returns (SyntheticCache memory);

    function getMargin(bytes32 _derivativeHash, LibDerivative.Derivative calldata _derivative)
        external
        returns (uint256 buyerMargin, uint256 sellerMargin);
}
