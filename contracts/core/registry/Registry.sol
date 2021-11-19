pragma solidity 0.8.5;

import "./RegistryStorageUpgradeable.sol";
import "../../libs/LibRoles.sol";
import "../../interfaces/IOpiumProxyFactory.sol";
import "../../interfaces/ISyntheticAggregator.sol";
import "../../interfaces/IOracleAggregator.sol";
import "../../interfaces/ITokenSpender.sol";
import "../../interfaces/ICore.sol";

/**
    Error codes:
    - R1 = ERROR_REGISTRY_ONLY_PROTOCOL_REGISTER_ROLE
    - R2 = ERROR_REGISTRY_ONLY_GUARDIAN
    - R3 = ERROR_REGISTRY_ONLY_WHITELISTER_ROLE
    - R4 = ERROR_REGISTRY_ONLY_PARAMETER_SETTER_ROLE
    - R5 = ERROR_REGISTRY_NULL_PROTOCOL_ADDRESS
    - R6 = ERROR_REGISTRY_ALREADY_PAUSED
    - R7 = ERROR_REGISTRY_NOT_PAUSED
    - R8 = ERROR_REGISTRY_ONLY_EXECUTION_FEE_REGISTER_ROLE
    - R9 = ERROR_REGISTRY_ONLY_REDEMPTION_FEE_REGISTER_ROLE
 */

contract RegistryUpgradeable is RegistryStorageUpgradeable {
    event LogExecutionFeeReceiverChange(address indexed _setter, address indexed _newExecutionFeeReceiver);
    event LogRedemptionFeeReceiverChange(address indexed _setter, address indexed _newRedemptionFeeReceiver);
    event LogExecutionFeeCapChange(address indexed _setter, uint32 indexed _executionFeeCap);
    event LogRedemptionFeeChange(address indexed _setter, uint32 indexed _executionFeeCap);
    event LogOpiumCommissionChange(address indexed _setter, uint32 indexed _opiumCommission);
    event LogNoDataCancellationPeriodChange(address indexed _setter, uint256 indexed _noDataCancellationPeriod);
    event LogProtocolState(address indexed _setter, bool indexed _protocolState);
    event LogWhitelistAccountAdded(address indexed _setter, address indexed _whitelisted);
    event LogWhitelistAccountRemoved(address indexed _setter, address indexed _unlisted);

    /// @notice it is called only once upon deployment of the contract. It initializes the registry storage with the given governor address as the admin role.
    /// @dev Calls RegistryStorageUpgradeable.__RegistryStorage__init
    /// @param _governor address of the governance account which will be assigned all the roles included in the LibRoles library and the OpenZeppelin AccessControl.DEFAULT_ADMIN_ROLE
    function initialize(address _governor) external initializer {
        __RegistryStorage__init(_governor);
    }

    // SETTERS

    /// @notice it allows the PROTOCOL_REGISTER role to set the addresses of Opium Protocol's contracts
    /// @dev the contracts' addresses are set using their respective interfaces
    /// @param _opiumProxyFactory address of Opium.OpiumProxyFactory
    /// @param _core address of Opium.Core
    /// @param _oracleAggregator address of Opium.OracleAggregator
    /// @param _syntheticAggregator address of Opium.SyntheticAggregator
    /// @param _tokenSpender address of Opium.TokenSpender
    /// @param _protocolExecutionFeeReceiver address of the recipient of Opium Protocol's fees originated from the profitable execution of a derivative's position
    /// @param _protocolRedemptionFeeReceiver address of the recipient of Opium Protocol's fees originated from the successful redemption of a market neutral position
    function setProtocolAddresses(
        address _opiumProxyFactory,
        address _core,
        address _oracleAggregator,
        address _syntheticAggregator,
        address _tokenSpender,
        address _protocolExecutionFeeReceiver,
        address _protocolRedemptionFeeReceiver
    ) external onlyProtocolRegister {
        require(
            _opiumProxyFactory != address(0) &&
                _core != address(0) &&
                _oracleAggregator != address(0) &&
                _syntheticAggregator != address(0) &&
                _tokenSpender != address(0),
            "R5"
        );

        protocolAddressesArgs = RegistryEntities.ProtocolAddressesArgs({
            opiumProxyFactory: IOpiumProxyFactory(_opiumProxyFactory),
            core: ICore(_core),
            oracleAggregator: IOracleAggregator(_oracleAggregator),
            syntheticAggregator: ISyntheticAggregator(_syntheticAggregator),
            tokenSpender: ITokenSpender(_tokenSpender),
            protocolExecutionFeeReceiver: _protocolExecutionFeeReceiver,
            protocolRedemptionFeeReceiver: _protocolRedemptionFeeReceiver
        });
    }

    /// @notice allows the EXECUTION_FEE_RECIPIENT_REGISTER_ROLE role to change the address that receives the fees originated from the successful execution of a profitable derivative's position
    /// @param _executionFeeRecipient address that will replace the current `protocolExecutionFeeReceiver = _executionFeeRecipient`
    /// @dev it must be a non-null address
    function setExecutionFeeReceiver(address _executionFeeRecipient) external onlyProtocolExecutionFeeAddressSetter {
        require(_executionFeeRecipient != address(0));
        protocolAddressesArgs.protocolExecutionFeeReceiver = _executionFeeRecipient;
        emit LogExecutionFeeReceiverChange(msg.sender, _executionFeeRecipient);
    }

    /// @notice allows the REDEMPTION_FEE_RECIPIENT_REGISTER_ROLE role to change the address that receives the fees originated from the redemption of a market-neutral position
    /// @param _redemptionFeeRecipient address that will replace the current `protocolAddressesArgs.protocolRedemptionFeeReceiver`
    /// @dev it must be a non-null address
    function setRedemptionFeeReceiver(address _redemptionFeeRecipient) external onlyProtocolRedemptionAddressFeeSetter {
        require(_redemptionFeeRecipient != address(0));
        protocolAddressesArgs.protocolRedemptionFeeReceiver = _redemptionFeeRecipient;
        emit LogRedemptionFeeReceiverChange(msg.sender, _redemptionFeeRecipient);
    }

    /// @notice allows the EXECUTION_FEE_CAP_SETTER_ROLE role to change maximum fee that a derivative author can receive for the profitable execution of a position of a derivative they created
    function setDerivativeAuthorExecutionFeeCap(uint32 _executionFeeCap) external onlyExecutionFeeCapSetter {
        protocolParametersArgs.derivativeAuthorExecutionFeeCap = _executionFeeCap;
        emit LogExecutionFeeCapChange(msg.sender, _executionFeeCap);
    }

    /// @notice allows the REDEMPTION_FEE_SETTER_ROLE role to change the fixed fee that a derivative author can receive for the successful redemption of a market-neutral positions pair of a derivative they created
    function setDerivativeAuthorRedemptionFee(uint32 _redemptionFee) external onlyExecutionFeeCapSetter {
        protocolParametersArgs.derivativeAuthorRedemptionFee = _redemptionFee;
        emit LogRedemptionFeeChange(msg.sender, _redemptionFee);
    }

    /// @notice allows the COMMISSIONER role to change the protocolReceiver's fee
    function setOpiumCommissionPart(uint8 _protocolCommissionPart) external onlyParameterSetter {
        protocolParametersArgs.protocolCommissionPart = _protocolCommissionPart;
        emit LogOpiumCommissionChange(msg.sender, _protocolCommissionPart);
    }

    /// @notice allows the COMMISSIONER role to change the noDataCancellationPeriod (the timeframe after which a derivative can be cancelled if the oracle has not provided any data)
    function setNoDataCancellationPeriod(uint32 _noDataCancellationPeriod) external onlyParameterSetter {
        protocolParametersArgs.noDataCancellationPeriod = _noDataCancellationPeriod;
        emit LogNoDataCancellationPeriodChange(msg.sender, _noDataCancellationPeriod);
    }

    /// @notice allows the GUARDIAN role to pause the Opium Protocol
    /// @dev it fails if the protocol is already paused
    function pause() external onlyGuardian {
        require(protocolParametersArgs.paused == false, "R6"); //already paused
        protocolParametersArgs.paused = true;
        emit LogProtocolState(msg.sender, true);
    }

    /// @notice allows the GUARDIAN role to unpause the Opium Protocol
    /// @dev it fails if the protocol is not paused
    function unpause() external onlyGuardian {
        require(protocolParametersArgs.paused == true, "R7"); //not paused
        protocolParametersArgs.paused = false;
        emit LogProtocolState(msg.sender, false);
    }

    /// @notice it allows the WHITELISTER role to add an address to the whitelist
    function addToWhitelist(address _whitelisted) external onlyWhitelister {
        coreSpenderWhitelist[_whitelisted] = true;
        emit LogWhitelistAccountAdded(msg.sender, _whitelisted);
    }

    /// @notice it allows the WHITELISTER role to remove an address from the whitelist
    function removeFromWhitelist(address _whitelisted) external onlyWhitelister {
        delete coreSpenderWhitelist[_whitelisted];
        emit LogWhitelistAccountRemoved(msg.sender, _whitelisted);
    }

    // GETTERS

    /// @notice Returns true if msg.sender has been assigned the REGISTRY_MANAGER_ROLE role
    /// @param _address address to be checked
    /// @dev it is meant to be consumed by the RegistryManager module
    function getRegistryManager(address _address) external view returns (bool) {
        return hasRole(LibRoles.REGISTRY_MANAGER_ROLE, _address);
    }

    /// @notice Returns all the commission-related parameters of the Opium protocol contracts
    ///@return RegistryEntities.getProtocolParameters struct that packs the protocol parameters {see RegistryEntities comments}
    function getProtocolParameters() external view returns (RegistryEntities.ProtocolParametersArgs memory) {
        return protocolParametersArgs;
    }

    /// @notice Returns the interfaces of the Opium protocol contracts
    ///@return RegistryEntities.ProtocolAddressesArgs struct that packs all the interfaces of the Opium Protocol
    function getProtocolAddresses() external view returns (RegistryEntities.ProtocolAddressesArgs memory) {
        return protocolAddressesArgs;
    }

    /// @notice Returns address of Opium.Core
    function getCore() external view returns (address) {
        return address(protocolAddressesArgs.core);
    }

    /// @notice Returns whether the Opium protocol is paused
    function isPaused() external view returns (bool) {
        return protocolParametersArgs.paused;
    }

    /// @notice Returns whether a given address is allowed to manage Opium.Core ERC20 balances
    function isCoreSpenderWhitelisted(address _address) external view returns (bool) {
        return coreSpenderWhitelist[_address];
    }
}
