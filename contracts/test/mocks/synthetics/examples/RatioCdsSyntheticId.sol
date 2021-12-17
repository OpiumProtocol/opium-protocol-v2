pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/access/Ownable.sol";

import "../../../../interfaces/IDerivativeLogic.sol";

contract RatioCdsSyntheticId is IDerivativeLogic, Ownable {
  address private author;
  uint256 private commission;

  uint256 constant public TRIGGER_BASE = 1e18;


  constructor(address _author, uint256 _commission) {
    /*
    {
      "author": "Opium.Team",
      "type": "swap",
      "subtype": "cds",
      "description": "Ratio CDS logic contract"
    }
    */
    emit LogMetadataSet("{\"author\":\"Opium.Team\",\"type\":\"swap\",\"subtype\":\"cds\",\"description\":\"Ratio CDS logic contract\"}");
    
    author = _author;
    commission = _commission;
  }

  /// @return Returns the custom name of a derivative ticker which will be used as part of the name of its positions
  function getSyntheticIdName() external view override returns (string memory) {
    return "CDS";
  }

  // params[0] - Trigger
  // params[1] - Fixed Premium
  function validateInput(LibDerivative.Derivative calldata _derivative) public view override returns (bool) {
    return (
      // Derivative
      _derivative.endTime > block.timestamp &&
      _derivative.margin > 0 &&
      _derivative.params.length == 2 &&

      _derivative.params[0] > 0 && // Trigger
      _derivative.params[0] <= TRIGGER_BASE // Trigger
    );
  }

  function getMargin(LibDerivative.Derivative calldata _derivative) public pure override returns (uint256 buyerMargin, uint256 sellerMargin) {
    uint256 fixedPremium = _derivative.params[1];
    uint256 nominal = _derivative.margin;
    buyerMargin = fixedPremium;
    sellerMargin = nominal;
  }

  function getExecutionPayout(LibDerivative.Derivative calldata _derivative, uint256 _result) public view override returns (uint256 buyerPayout, uint256 sellerPayout) {
    uint256 trigger = _derivative.params[0];
    uint256 fixedPremium = _derivative.params[1];
    uint256 nominal = _derivative.margin;

    if (_result < trigger) {
      sellerPayout = nominal * _result / TRIGGER_BASE;
      buyerPayout = nominal - sellerPayout;
    } else {
      buyerPayout = 0;
      sellerPayout = nominal;
    }

    // Add premium
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
  function getAuthorCommission() public view override returns (uint256) {
    return commission;
  }

  /** THIRDPARTY EXECUTION */
  function thirdpartyExecutionAllowed(address) public pure override returns (bool) {
    return true;
  }

  function allowThirdpartyExecution(bool) public pure override {
  }

  /** GOVERNANCE */
  function setAuthorAddress(address _author) public onlyOwner {
    require(_author != address(0), "Can't set to zero address");
    author = _author;
  }

  function setAuthorCommission(uint256 _commission) public onlyOwner {
    commission = _commission;
  }
}
