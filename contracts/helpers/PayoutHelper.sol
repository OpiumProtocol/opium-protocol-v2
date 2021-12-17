// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "../interfaces/IDerivativeLogic.sol";
import "../libs/LibDerivative.sol";

contract PayoutHelper {
    struct ExecutionPayout {
        uint256 buyerPayout;
        uint256 sellerPayout;
    }

    function getExecutionPayouts(LibDerivative.Derivative calldata _derivative, uint256[] calldata _results)
        external
        view
        returns (ExecutionPayout[] memory executionPayouts)
    {
        IDerivativeLogic logic = IDerivativeLogic(_derivative.syntheticId);

        executionPayouts = new ExecutionPayout[](_results.length);

        for (uint256 i = 0; i < _results.length; i++) {
            (uint256 buyerPayout, uint256 sellerPayout) = logic.getExecutionPayout(_derivative, _results[i]);
            executionPayouts[i] = ExecutionPayout(buyerPayout, sellerPayout);
        }
    }
}
