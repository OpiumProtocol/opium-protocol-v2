pragma solidity 0.8.5;

import "../../core/TokenSpender.sol";

contract TestTokenSpenderUpgrade is TokenSpender {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
