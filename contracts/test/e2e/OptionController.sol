pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "../../core/registry/RegistryEntities.sol";
import "../../interfaces/IRegistry.sol";
import "../../interfaces/ICore.sol";
import "../../interfaces/IOpiumProxyFactory.sol";
import "../../interfaces/ISyntheticAggregator.sol";
import "../../interfaces/ITokenSpender.sol";
import "../../libs/LibDerivative.sol";
import "../../libs/LibPosition.sol";
import "../../libs/LibCalculator.sol";

contract OptionController is Ownable {
    using SafeERC20 for IERC20;
    using LibDerivative for LibDerivative.Derivative;
    using LibPosition for bytes32;
    using LibCalculator for uint256;

    LibDerivative.Derivative private _derivative;
    RegistryEntities.ProtocolAddressesArgs private _protocolAddressesArgs;
    IRegistry private _registry;

    /// @param registry_ address of the current Opium.Registry contract 
    constructor(address registry_) {
        _registry = IRegistry(registry_);
        _protocolAddressesArgs = IRegistry(_registry).getProtocolAddresses();
    }

    /// @notice See `_getPositionAddress`
    function getPositionAddress(bool _isLong) external view returns (address) {
        return _getPositionAddress(_isLong);
    }

    /// @notice See `_getMarginRequirement`
    function getMarginRequirement(
        uint256 _buyerMargin,
        uint256 _sellerMargin,
        uint256 _amount
    ) external pure returns (uint256) {
        return _getMarginRequirement(_buyerMargin, _sellerMargin, _amount);
    }

    /// @notice getter for the contract's underlying `LibDerivative.Derivative _derivative`
    function getDerivative() external view returns (LibDerivative.Derivative memory) {
        return _derivative;
    }

    /// @notice Helper to set this contract's underlying derivative recipe
    /// @param derivative_ LibDerivative.Derivative derivative schema of the underlying synthetics
    function setDerivative(LibDerivative.Derivative calldata derivative_) external onlyOwner {
        _derivative = derivative_;
    }

    /// @notice Wrapper around `Opium.Core.create` to mint a derivative position contract
    /// @param _amount uint256 Amount of derivative positions to be created
    function create(uint256 _amount) external {
        (uint256 buyerMargin, uint256 sellerMargin) = _protocolAddressesArgs.syntheticAggregator.getMargin(
            _derivative.getDerivativeHash(),
            _derivative
        );
        uint256 requiredMargin = _getMarginRequirement(buyerMargin, sellerMargin, _amount);

        IERC20(_derivative.token).safeTransferFrom(msg.sender, address(this), requiredMargin);
        IERC20(_derivative.token).approve(address(_protocolAddressesArgs.tokenSpender), 0);
        IERC20(_derivative.token).approve(address(_protocolAddressesArgs.tokenSpender), requiredMargin);

        _protocolAddressesArgs.core.create(_derivative, _amount, [msg.sender, msg.sender]);
    }

    /// @notice Wrapper around `Opium.Core.execute` to execute a derivative LONG position
    /// @param _amount uint256 amount of SHORT positions to be executed
    function executeShort(uint256 _amount) external {
        address shortAddress = _getPositionAddress(false);
        _protocolAddressesArgs.core.execute(msg.sender, shortAddress, _amount);
    }

    /// @notice Wrapper around `Opium.Core.execute` to execute a derivative LONG position
    /// @param _amount uint256 amount of LONG positions to be executed
    function executeLong(uint256 _amount) external {
        address longAddress = _getPositionAddress(true);
        _protocolAddressesArgs.core.execute(msg.sender, longAddress, _amount);
    }

    /// @notice Helper that wraps around `LibCalculator.mulWithPrecisionFactor` to compute the collateral require requirements to mint new LONG/SHORT positions of a derivative
    /// @param _buyerMargin uint256 amount of required collateral to mint a single LONG position
    /// @param _sellerMargin uint256 amount of required collateral to mint a single SHORT position
    /// @param _amount uint256 amount of LONG/SHORT positions to be minted
    function _getMarginRequirement(
        uint256 _buyerMargin,
        uint256 _sellerMargin,
        uint256 _amount
    ) private pure returns (uint256) {
        return (_buyerMargin + _sellerMargin).mulWithPrecisionFactor(_amount);
    }

    /// @notice Wrapper around `LibPosition.predictDeterministicAddress` to compute the create2 address of a derivative position contract based on its derivativeHash as a salt
    /// @param _isLong bool true if the derivative position contract to be calculated is a LONG position, false if it is a SHORT position
    function _getPositionAddress(bool _isLong) private view returns (address) {
        bytes32 derivativeHash = _derivative.getDerivativeHash();
        address positionAddress = derivativeHash.predictDeterministicAddress(
            _isLong,
            _protocolAddressesArgs.opiumProxyFactory.getImplementationAddress(),
            address(_protocolAddressesArgs.opiumProxyFactory)
        );
        return positionAddress;
    }
}
