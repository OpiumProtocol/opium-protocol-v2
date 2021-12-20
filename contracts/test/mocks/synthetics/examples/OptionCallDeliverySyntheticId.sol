// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/access/Ownable.sol";

import "../../../../interfaces/IDerivativeLogic.sol";

contract OptionCallDeliverySyntheticId is IDerivativeLogic, Ownable {
  address private author;
  uint256 private commission;

  constructor(address _author, uint256 _commission) {
    /*
    {
      "author": "Opium.Team",
      "type": "option",
      "subtype": "call",
      "description": "Option Call with delivery logic contract"
    }
    */
    emit LogMetadataSet("{\"author\":\"Opium.Team\",\"type\":\"option\",\"subtype\":\"call\",\"description\":\"Option Call with delivery logic contract\"}");
    
    author = _author;
    commission = _commission;
  }

  /// @return Returns the custom name of a derivative ticker which will be used as part of the name of its positions
  function getSyntheticIdName() external pure override returns (string memory) {
    return "OPT-C";
  }

  // params[0] - Strike price
  // params[1] - fixedPremium
  function validateInput(LibDerivative.Derivative calldata _derivative) public view override returns (bool) {
    return (
      // Derivative
      _derivative.endTime > block.timestamp &&
      _derivative.margin > 0 &&
      _derivative.params.length == 2 &&

      _derivative.params[0] > 0 // Strike price > 0
    );
  }

  function getMargin(LibDerivative.Derivative calldata _derivative) external pure override returns (uint256 buyerMargin, uint256 sellerMargin) {
    uint256 fixedPremium = _derivative.params[1];
    uint256 nominal = _derivative.margin;
    buyerMargin = fixedPremium;
    sellerMargin = nominal;
  }

  function getExecutionPayout(LibDerivative.Derivative calldata _derivative, uint256 _result) external pure override returns (uint256 buyerPayout, uint256 sellerPayout) {
    uint256 strikePrice = _derivative.params[0];
    uint256 fixedPremium = _derivative.params[1];
    uint256 nominal = _derivative.margin;

    if (_result > strikePrice) {
      // buyer payout = margin * (result - strike price) / result
      buyerPayout = nominal * (_result - strikePrice) / _result;

      // seller payout = margin - buyer payout
      sellerPayout = nominal - buyerPayout;
    } else {
      // buyer payout = 0
      buyerPayout = 0;
      
      // seller payout = margin
      sellerPayout = nominal;
    }

    // Add fixed premium to seller payout
    sellerPayout = sellerPayout + fixedPremium;
  }

  /** COMMISSION */
  /// @notice Getter for syntheticId author address
  /// @return address syntheticId author address
  function getAuthorAddress() public view override returns (address) {
    return author;
  }

  /// @notice Getter for syntheticId author commission
  /// @return uint26 syntheticId author commission
  function getAuthorCommission() external view override returns (uint256) {
    return commission;
  }

  /** THIRDPARTY EXECUTION */
  function thirdpartyExecutionAllowed(address) external pure override returns (bool) {
    return true;
  }

  function allowThirdpartyExecution(bool) external override {}

  /** GOVERNANCE */
  function setAuthorAddress(address _author) public onlyOwner {
    require(_author != address(0), "Can't set to zero address");
    author = _author;
  }

  function setAuthorCommission(uint256 _commission) external onlyOwner {
    commission = _commission;
  }
}
