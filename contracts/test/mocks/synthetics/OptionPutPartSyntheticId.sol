pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "../../../interfaces/IDerivativeLogic.sol";

contract OptionPutPartSyntheticId is IDerivativeLogic, Ownable {
    address private immutable author;
    uint256 private immutable part;

    uint256 private constant commission = 25; // 0.25% of profit
    uint256 public constant BASE_PPT = 1e18;

    constructor(address _author, uint256 _part) {
        emit LogMetadataSet(
            '{"author":"Opium.Team","type":"option","subtype":"put","description":"Option Put logic contract"}'
        );

        author = _author;
        part = _part;

        transferOwnership(_author);
    }

    // params[0] - Strike price
    // params[1] - PPT (Sensitivity)
    // params[2] - fixedPremium
    function validateInput(LibDerivative.Derivative memory _derivative) public view override returns (bool) {
        return (_derivative.endTime > block.timestamp &&
            _derivative.margin > 0 &&
            _derivative.params.length == 3 &&
            _derivative.params[0] > 0 && // Strike price > 0
            _derivative.params[1] > 0); // PPT > 0
    }

    function getMargin(LibDerivative.Derivative memory _derivative)
        external
        view
        override
        returns (uint256 buyerMargin, uint256 sellerMargin)
    {
        uint256 fixedPremium = _derivative.params[2];
        buyerMargin = fixedPremium;
        uint256 nominal = _derivative.margin;
        sellerMargin = (nominal * part) / BASE_PPT;
    }

    function getExecutionPayout(LibDerivative.Derivative memory _derivative, uint256 _result)
        external
        view
        override
        returns (uint256 buyerPayout, uint256 sellerPayout)
    {
        uint256 strikePrice = _derivative.params[0];
        // uint256 ppt = _derivative.params[1];  // Ignore PPT
        uint256 fixedPremium = _derivative.params[2];
        uint256 nominal = _derivative.margin;
        uint256 sellerMargin = (nominal * part) / BASE_PPT;

        // If result price is lower than strike price, buyer is paid out
        if (_result < strikePrice) {
            // buyer payout = margin * (strike price  - result) / strike price
            buyerPayout = (nominal * (strikePrice - _result) / strikePrice);

            if (buyerPayout > sellerMargin) {
                buyerPayout = sellerMargin;
            }

            // seller payout = margin - buyer payout
            sellerPayout = sellerMargin - buyerPayout;
        } else {
            // buyer payout = 0
            buyerPayout = 0;

            // seller payout = margin
            sellerPayout = sellerMargin;
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
    function getAuthorCommission() public pure override returns (uint256) {
        return commission;
    }

    /// @return Returns the custom name of a derivative ticker which will be used as part of the name of its positions
    function getSyntheticIdName() external pure override returns (string memory) {
        return "OPT-P";
    }

    /** THIRDPARTY EXECUTION */
    function thirdpartyExecutionAllowed(address derivativeOwner) public pure override returns (bool) {
        return true;
    }

    function allowThirdpartyExecution(bool allow) external override {}
}
