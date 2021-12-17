// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "../../../interfaces/IDerivativeLogic.sol";
import "../../../helpers/ExecutableByThirdParty.sol";
import "../../../helpers/HasCommission.sol";

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
        emit LogMetadataSet(
            '{"author":"opium.team","type":"synthetic","subtype":"none","description":"Dummy synthetic for testing purposes"}'
        );
    }

    /// @return Returns the custom name of a derivative ticker which will be used as part of the name of its positions
    function getSyntheticIdName() external pure override returns (string memory) {
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

    function validateInput(LibDerivative.Derivative memory _derivative) external view override returns (bool) {
        _derivative;
        return true;
    }

    function getMargin(LibDerivative.Derivative memory _derivative)
        external
        view
        override
        returns (uint256 buyerMargin, uint256 sellerMargin)
    {
        buyerMargin = _derivative.margin;
        sellerMargin = _derivative.margin;
    }

    function getExecutionPayout(LibDerivative.Derivative memory _derivative, uint256 _result)
        external
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
