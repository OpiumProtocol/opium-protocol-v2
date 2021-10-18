pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

import "../Interface/IDerivativeLogic.sol";

import "../Helpers/ExecutableByThirdParty.sol";
import "../Helpers/HasCommission.sol";

contract DummySyntheticIdMock is IDerivativeLogic, ExecutableByThirdParty, HasCommission {
    constructor() {
        /*
        {
            "author": "opium.team",
            "type": "synthetic",
            "subtype": "none",
            "description": "Dummy synthetic for testing purposes"
        }
        */
        emit MetadataSet(
            '{"author":"opium.team","type":"synthetic","subtype":"none","description":"Dummy synthetic for testing purposes"}'
        );
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

    function validateInput(LibDerivative.Derivative memory _derivative) public view override returns (bool) {
        _derivative;
        return true;
    }

    function getMargin(LibDerivative.Derivative memory _derivative)
        public
        view
        override
        returns (uint256 buyerMargin, uint256 sellerMargin)
    {
        buyerMargin = _derivative.margin;
        sellerMargin = _derivative.margin;
    }

    function getExecutionPayout(LibDerivative.Derivative memory _derivative, uint256 _result)
        public
        view
        override
        returns (uint256 buyerPayout, uint256 sellerPayout)
    {
        buyerPayout = _derivative.margin;
        sellerPayout = _derivative.margin;
        _result;
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
