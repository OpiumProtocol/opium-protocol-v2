pragma solidity 0.8.5;

import "../../TokenSpender.sol";

contract TestTokenSpenderUpgrade is TokenSpender {
    function placeholder() external pure returns (string memory) {
        return "upgraded";
    }
}
