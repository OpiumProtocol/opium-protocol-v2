pragma solidity 0.8.5;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../core/registry/RegistryEntities.sol";
import "../../interfaces/IRegistry.sol";
import "../../interfaces/ICore.sol";
import "../../interfaces/IOpiumProxyFactory.sol";
import "../../interfaces/ISyntheticAggregator.sol";
import "../../interfaces/ITokenSpender.sol";
import "../../libs/LibDerivative.sol";
import "../../libs/LibPosition.sol";
import "../../libs/LibCalculator.sol";

contract OptionController {
    using SafeERC20 for IERC20;
    using LibDerivative for LibDerivative.Derivative;
    using LibPosition for bytes32;
    using LibCalculator for uint256;

    LibDerivative.Derivative private _derivative;
    RegistryEntities.ProtocolAddressesArgs private _protocolAddressesArgs;
    IRegistry private _registry;

    constructor(address registry_) {
        _registry = IRegistry(registry_);
        _protocolAddressesArgs = IRegistry(_registry).getProtocolAddresses();
    }

    function setDerivative(LibDerivative.Derivative calldata derivative_) external {
        _derivative = derivative_;
    }

    function getPositionAddress(bool _isLong) public view returns (address) {
        bytes32 derivativeHash = _derivative.getDerivativeHash();
        address positionAddress = derivativeHash.predictDeterministicAddress(
            _isLong,
            _protocolAddressesArgs.opiumProxyFactory.getImplementationAddress(),
            address(_protocolAddressesArgs.opiumProxyFactory)
        );
        return positionAddress;
    }

    function create(uint256 _amount) external {
        (uint256 buyerMargin, uint256 sellerMargin) = ISyntheticAggregator(_protocolAddressesArgs.syntheticAggregator)
            .getMargin(_derivative.getDerivativeHash(), _derivative);
        uint256 requiredMargin = _computeMarginRequirement(buyerMargin, sellerMargin, _amount);

        IERC20(_derivative.token).safeTransferFrom(msg.sender, address(this), requiredMargin);
        IERC20(_derivative.token).approve(address(_protocolAddressesArgs.tokenSpender), 0);
        IERC20(_derivative.token).approve(address(_protocolAddressesArgs.tokenSpender), requiredMargin);

        ICore(_protocolAddressesArgs.core).create(_derivative, _amount, [msg.sender, msg.sender]);
    }

    function executeShort(uint256 _amount) external {
        address shortAddress = getPositionAddress(false);
        _protocolAddressesArgs.core.execute(msg.sender, shortAddress, _amount);
    }

    function executeLong(uint256 _amount) external {
        address longAddress = getPositionAddress(true);
        _protocolAddressesArgs.core.execute(msg.sender, longAddress, _amount);
    }

    function _computeMarginRequirement(
        uint256 _buyerMargin,
        uint256 _sellerMargin,
        uint256 _amount
    ) private pure returns (uint256) {
        return (_buyerMargin + _sellerMargin).mulWithPrecisionFactor(_amount);
    }
}
