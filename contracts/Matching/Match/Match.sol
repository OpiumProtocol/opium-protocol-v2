pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "./MatchCreate.sol";
import "./MatchSwap.sol";

/// @title Opium.Matching.Match contract combines Opium.Matching.MatchCreate and Opium.Matching.MatchSwap into one contract
contract Match is MatchCreate, MatchSwap {

    /// @notice Calls constructors of super-contracts
    /// @param _registry address Address of Opium.registry
    constructor (address _registry) public UsingRegistry(_registry) {}
}
