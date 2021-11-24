pragma solidity 0.8.5;

import "../../../interfaces/IDerivativeLogic.sol";
import "../../../helpers/ExecutableByThirdParty.sol";
import "../../../helpers/HasCommission.sol";

contract OptionCallSyntheticIdMock is IDerivativeLogic, ExecutableByThirdParty, HasCommission {
    uint256 constant BASE_PPT = 1 ether;

    constructor() {
        /*
        {
            "author": "DIB.ONE",
            "type": "option",
            "subtype": "call",
            "description": "Option Call logic contract"
        }
        */
        emit LogMetadataSet(
            '{"author":"DIB.ONE","type":"option","subtype":"call","description":"Option Call logic contract"}'
        );
    }

    /// @return Returns the custom name of a derivative ticker which will be used as part of the name of its positions
    function getSyntheticIdCustomName() external view override returns(string memory) {
        return "Riccardo's derivative shop";
    }

    /// @notice Getter for syntheticId author address
    /// @return address syntheticId author address
    function getAuthorAddress() public view virtual override(IDerivativeLogic, HasCommission) returns (address) {
        return HasCommission.getAuthorAddress();
    }

    /// @notice Getter for syntheticId author commission
    /// @return uint26 syntheticId author commission
    function getAuthorCommission() public view override(IDerivativeLogic, HasCommission) returns (uint256) {
        return HasCommission.getAuthorCommission();
    }

    function validateInput(LibDerivative.Derivative calldata _derivative) external view override returns (bool) {
        if (_derivative.params.length < 1) {
            return false;
        }

        uint256 ppt;

        if (_derivative.params.length == 2) {
            ppt = _derivative.params[1];
        } else {
            ppt = BASE_PPT;
        }

        uint256 strikePrice = _derivative.params[0];
        return (_derivative.margin > 0 && _derivative.endTime > block.timestamp && strikePrice > 0 && ppt > 0);
    }

    function getMargin(LibDerivative.Derivative calldata _derivative)
        external
        view
        override
        returns (uint256 buyerMargin, uint256 sellerMargin)
    {
        buyerMargin = 0;
        sellerMargin = _derivative.margin;
    }

    function getExecutionPayout(LibDerivative.Derivative calldata _derivative, uint256 _result)
        external
        view
        override
        returns (uint256 buyerPayout, uint256 sellerPayout)
    {
        uint256 ppt;

        uint256 strikePrice = _derivative.params[0];

        if (_derivative.params.length == 2) {
            ppt = _derivative.params[1];
        } else {
            ppt = BASE_PPT;
        }

        if (_result > strikePrice) {
            uint256 profit = _result - strikePrice;
            profit = (profit * ppt) / BASE_PPT;

            if (profit < _derivative.margin) {
                buyerPayout = profit;
                sellerPayout = _derivative.margin - profit;
            } else {
                buyerPayout = _derivative.margin;
                sellerPayout = 0;
            }
        } else {
            buyerPayout = 0;
            sellerPayout = _derivative.margin;
        }
    }

    function allowThirdpartyExecution(bool allow) public virtual override(IDerivativeLogic, ExecutableByThirdParty) {
        ExecutableByThirdParty.allowThirdpartyExecution(allow);
    }

    function thirdpartyExecutionAllowed(address derivativeOwner)
        public
        view
        virtual
        override(IDerivativeLogic, ExecutableByThirdParty)
        returns (bool)
    {
        return ExecutableByThirdParty.thirdpartyExecutionAllowed(derivativeOwner);
    }
}
