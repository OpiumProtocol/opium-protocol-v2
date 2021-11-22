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
    - R1 = ERROR_REGISTRY_PROTOCOL_ADDRESSES_SETTER_ROLE
    - R2 = ERROR_REGISTRY_ONLY_EXECUTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE
    - R3 = ERROR_REGISTRY_ONLY_REDEMPTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE
    - R4 = ERROR_REGISTRY_ONLY_OPIUM_FEE_SETTER_ROLE
    - R5 = ERROR_REGISTRY_ONLY_NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE
    - R6 = ERROR_REGISTRY_ONLY_GUARDIAN_ROLE
    - R7 = ERROR_REGISTRY_ONLY_WHITELISTER_ROLE
    - R8 = ERROR_REGISTRY_ONLY_EXECUTION_FEE_CAP_SETTER_ROLE
    - R9 = ERROR_REGISTRY_ONLY_REDEMPTION_FEE_SETTER_ROLE
    - R10 = ERROR_REGISTRY_ALREADY_PAUSED
    - R11 = ERROR_REGISTRY_NOT_PAUSED
    - R12 = ERROR_REGISTRY_NULL_ADDRESS

 */

contract RegistryUpgradeable is RegistryStorageUpgradeable {
    event LogExecutionFeeReceiverChange(address indexed _setter, address indexed _newExecutionFeeReceiver);
    event LogRedemptionFeeReceiverChange(address indexed _setter, address indexed _newRedemptionFeeReceiver);
    event LogExecutionFeeCapChange(address indexed _setter, uint32 indexed _executionFeeCap);
    event LogRedemptionFeeChange(address indexed _setter, uint32 indexed _redemptionFee);
    event LogOpiumCommissionChange(address indexed _setter, uint32 indexed _opiumCommission);
    event LogNoDataCancellationPeriodChange(address indexed _setter, uint256 indexed _noDataCancellationPeriod);
    event LogProtocolPausableState(address indexed _setter, bool indexed _protocolState);
    event LogWhitelistAccountAdded(address indexed _setter, address indexed _whitelisted);
    event LogWhitelistAccountRemoved(address indexed _setter, address indexed _unlisted);

    // ****************** EXTERNAL FUNCTIONS ******************

    // ***** SETTERS *****

    /// @notice it is called only once upon deployment of the contract. It initializes the registry storage with the given governor address as the admin role.
    /// @dev Calls RegistryStorageUpgradeable.__RegistryStorage__init
    /// @param _governor address of the governance account which will be assigned all the roles included in the LibRoles library and the OpenZeppelin AccessControl.DEFAULT_ADMIN_ROLE
    function initialize(address _governor) external initializer {
        __RegistryStorage__init(_governor);
    }

    /// @notice It allows the PROTOCOL_REGISTER role to set the addresses of Opium Protocol's contracts
    /// @dev It must be called as part of the protocol's deployment setup after the core addresses have been deployed
    /// @dev the contracts' addresses are set using their respective interfaces
    /// @param _opiumProxyFactory address of Opium.OpiumProxyFactory
    /// @param _core address of Opium.Core
    /// @param _oracleAggregator address of Opium.OracleAggregator
    /// @param _syntheticAggregator address of Opium.SyntheticAggregator
    /// @param _tokenSpender address of Opium.TokenSpender
    function setProtocolAddresses(
        address _opiumProxyFactory,
        address _core,
        address _oracleAggregator,
        address _syntheticAggregator,
        address _tokenSpender
    ) external onlyProtocolRegister {
        require(
            _opiumProxyFactory != address(0) &&
                _core != address(0) &&
                _oracleAggregator != address(0) &&
                _syntheticAggregator != address(0) &&
                _tokenSpender != address(0),
            "R12"
        );
        protocolAddressesArgs.core = ICore(_core);
        protocolAddressesArgs.opiumProxyFactory = IOpiumProxyFactory(_opiumProxyFactory);
        protocolAddressesArgs.syntheticAggregator = ISyntheticAggregator(_syntheticAggregator);
        protocolAddressesArgs.tokenSpender = ITokenSpender(_tokenSpender);
        protocolAddressesArgs.oracleAggregator = IOracleAggregator(_oracleAggregator);
    }

    /// @notice allows the EXECUTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE role to change the address that receives the fees originated from the successful execution of a profitable derivative's position
    /// @dev It must be called as part of the protocol's deployment setup after the core addresses have been deployed
    /// @param _executionFeeRecipient address that will replace the current `protocolExecutionFeeReceiver = _executionFeeRecipient`
    /// @dev it must be a non-null address
    function setProtocolExecutionFeeReceiver(address _executionFeeRecipient)
        external
        onlyProtocolExecutionFeeAddressSetter
    {
        require(_executionFeeRecipient != address(0), "R12");
        protocolAddressesArgs.protocolExecutionFeeReceiver = _executionFeeRecipient;
        emit LogExecutionFeeReceiverChange(msg.sender, _executionFeeRecipient);
    }

    /// @notice allows the REDEMPTION_FEE_RECIPIENT_ADDRESS_SETTER_ROLE role to change the address that receives the fees originated from the redemption of a market-neutral position
    /// @dev It must be called as part of the protocol's deployment setup after the core addresses have been deployed
    /// @param _redemptionFeeRecipient address that will replace the current `protocolAddressesArgs.protocolRedemptionFeeReceiver`
    /// @dev it must be a non-null address
    function setProtocolRedemptionFeeReceiver(address _redemptionFeeRecipient)
        external
        onlyProtocolRedemptionAddressFeeSetter
    {
        require(_redemptionFeeRecipient != address(0), "R12");
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

    /// @notice It allows the OPIUM_FEE_SETTER_ROLE role to change the portion of the fee that is distributed to the protocol's recipients
    function setProtocolFeePart(uint32 _protocolCommissionPart) external onlyOpiumFeeSetter {
        protocolParametersArgs.protocolCommissionPart = _protocolCommissionPart;
        emit LogOpiumCommissionChange(msg.sender, _protocolCommissionPart);
    }

    /// @notice It allows the NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE role to change the noDataCancellationPeriod (the timeframe after which a derivative can be cancelled if the oracle has not provided any data)
    function setNoDataCancellationPeriod(uint32 _noDataCancellationPeriod) external onlyNoDataCancellationPeriodSetter {
        protocolParametersArgs.noDataCancellationPeriod = _noDataCancellationPeriod;
        emit LogNoDataCancellationPeriodChange(msg.sender, _noDataCancellationPeriod);
    }

    /// @notice allows the GUARDIAN role to pause the Opium Protocol
    /// @dev it fails if the protocol is already paused
    function pause() external onlyGuardian {
        require(!protocolParametersArgs.paused, "R10");
        protocolParametersArgs.paused = true;
        emit LogProtocolPausableState(msg.sender, true);
    }

    /// @notice allows the GUARDIAN role to unpause the Opium Protocol
    /// @dev it fails if the protocol is not paused
    function unpause() external onlyGuardian {
        require(protocolParametersArgs.paused, "R11");
        protocolParametersArgs.paused = false;
        emit LogProtocolPausableState(msg.sender, false);
    }

    /// @notice It allows the WHITELISTER_ROLE to add an address to the whitelist
    function addToWhitelist(address _whitelisted) external onlyWhitelister {
        coreSpenderWhitelist[_whitelisted] = true;
        emit LogWhitelistAccountAdded(msg.sender, _whitelisted);
    }

    /// @notice It allows the WHITELISTER_ROLE to remove an address from the whitelist
    function removeFromWhitelist(address _whitelisted) external onlyWhitelister {
        delete coreSpenderWhitelist[_whitelisted];
        emit LogWhitelistAccountRemoved(msg.sender, _whitelisted);
    }

    // ***** GETTERS *****

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

    /// @notice Returns true if msg.sender has been assigned the REGISTRY_MANAGER_ROLE role
    /// @param _address address to be checked
    /// @dev it is meant to be consumed by the RegistryManager module
    function isRegistryManager(address _address) external view returns (bool) {
        return hasRole(LibRoles.REGISTRY_MANAGER_ROLE, _address);
    }

    /// @notice It returns the address of Opium.Core
    function getCore() external view returns (address) {
        return address(protocolAddressesArgs.core);
    }

    /// @notice It returns whether the Opium protocol is paused
    function isPaused() external view returns (bool) {
        return protocolParametersArgs.paused;
    }

    /// @notice It returns whether a given address is allowed to manage Opium.Core ERC20 balances
    function isCoreSpenderWhitelisted(address _address) external view returns (bool) {
        return coreSpenderWhitelist[_address];
    }
}
