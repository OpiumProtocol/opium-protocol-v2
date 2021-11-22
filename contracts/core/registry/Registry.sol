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

    - R13 = ERROR_REGISTRY_PARTIAL_CREATE_PAUSE_ROLE
    - R14 = ERROR_REGISTRY_PARTIAL_MINT_PAUSE_ROLE
    - R15 = ERROR_REGISTRY_ONLY_PARTIAL_REDEEM_PAUSE_ROLE
    - R16 = ERROR_REGISTRY_ONLY_PARTIAL_EXECUTE_PAUSE_ROLE
    - R17 = ERROR_REGISTRY_ONLY_PARTIAL_CANCEL_PAUSE_ROLE
    - R18 = ERROR_REGISTRY_ONLY_PARTIAL_CLAIM_RESERVE_PAUSE_ROLE
    - R19 = ERROR_REGISTRY_ONLY_PROTOCOL_UNPAUSER_ROLE

 */

contract RegistryUpgradeable is RegistryStorageUpgradeable {
    event LogExecutionFeeReceiverChange(address indexed _setter, address indexed _newExecutionFeeReceiver);
    event LogRedemptionFeeReceiverChange(address indexed _setter, address indexed _newRedemptionFeeReceiver);
    event LogExecutionFeeCapChange(address indexed _setter, uint32 indexed _executionFeeCap);
    event LogRedemptionFeeChange(address indexed _setter, uint32 indexed _redemptionFee);
    event LogOpiumCommissionChange(address indexed _setter, uint32 indexed _opiumCommission);
    event LogNoDataCancellationPeriodChange(address indexed _setter, uint256 indexed _noDataCancellationPeriod);
    // emits the role to signal what type of pause has been committed, if any
    event LogProtocolPausableState(address indexed _setter, bool indexed _protocolState, bytes32 indexed _role);
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
        require(!protocolPausabilityArgs.protocolGlobal, "R10");
        protocolPausabilityArgs.protocolGlobal = true;
        emit LogProtocolPausableState(msg.sender, true, LibRoles.GUARDIAN_ROLE);
    }

    /// @notice allows the PROTOCOL_UNPAUSER_ROLE to unpause the Opium Protocol
    /// @dev it fails if the protocol is not paused
    function unpause() external onlyProtocolUnpauserSetter {
        require(protocolPausabilityArgs.protocolGlobal, "R11");
        delete protocolPausabilityArgs;
        emit LogProtocolPausableState(msg.sender, false, LibRoles.PROTOCOL_UNPAUSER_ROLE);
    }

    /// @notice allows the PARTIAL_CREATE_PAUSE_ROLE role to pause the creation of position
    /// @dev it fails if the protocol is not globally paused
    function pauseProtocolPositionCreation() external onlyPartialCreatePauseSetter {
        require(!protocolPausabilityArgs.protocolGlobal, "R11");
        protocolPausabilityArgs.protocolPositionCreation = true;
        emit LogProtocolPausableState(msg.sender, true, LibRoles.PARTIAL_CREATE_PAUSE_ROLE);
    }

    /// @notice allows the PARTIAL_MINT_PAUSE_ROLE role to pause the creation of position
    /// @dev it fails if the protocol is not globally paused
    function pauseProtocolPositionMint() external onlyPartialMintPauseSetter {
        require(!protocolPausabilityArgs.protocolGlobal, "R11");
        protocolPausabilityArgs.protocolPositionCreation = true;
        emit LogProtocolPausableState(msg.sender, true, LibRoles.PARTIAL_MINT_PAUSE_ROLE);
    }

    /// @notice allows the PARTIAL_EXECUTE_PAUSE_ROLE role to pause the creation of position
    /// @dev it fails if the protocol is not globally paused
    function pauseProtocolPositionExecuted() external onlyPartialExecutePauseSetter {
        require(!protocolPausabilityArgs.protocolGlobal, "R11");
        protocolPausabilityArgs.protocolPositionMinting = true;
        emit LogProtocolPausableState(msg.sender, true, LibRoles.PARTIAL_REDEEM_PAUSE_ROLE);
    }

    /// @notice allows the PARTIAL_REDEEM_PAUSE_ROLE role to pause the creation of position
    /// @dev it fails if the protocol is not globally paused
    function pauseProtocolPositionRedemption() external onlyPartialRedeemPauseSetter {
        require(!protocolPausabilityArgs.protocolGlobal, "R11");
        protocolPausabilityArgs.protocolPositionMinting = true;
        emit LogProtocolPausableState(msg.sender, true, LibRoles.PARTIAL_REDEEM_PAUSE_ROLE);
    }

    /// @notice allows the PARTIAL_CANCEL_PAUSE_ROLE to unpause the Opium Protocol
    /// @dev it fails if the protocol is not paused
    function pauseProtocolPositionCancellation() external onlyGuardian {
        require(!protocolPausabilityArgs.protocolGlobal, "R11");
        protocolPausabilityArgs.protocolPositionCancellation = true;
        emit LogProtocolPausableState(msg.sender, true, LibRoles.PARTIAL_CANCEL_PAUSE_ROLE);
    }

    /// @notice allows the PARTIAL_CLAIM_RESERVE_PAUSE_ROLE to unpause the Opium Protocol
    /// @dev it fails if the protocol is not paused
    function pauseProtocolReserveClaim() external onlyPartialClaimReservePauseSetter {
        require(!protocolPausabilityArgs.protocolGlobal, "R11");
        protocolPausabilityArgs.protocolReserveClaim = true;
        emit LogProtocolPausableState(msg.sender, true, LibRoles.PARTIAL_CLAIM_RESERVE_PAUSE_ROLE);
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

    ///@return RegistryEntities.getProtocolParameters struct that packs the protocol lifecycle parameters {see RegistryEntities comments}
    function getProtocolParameters() external view returns (RegistryEntities.ProtocolParametersArgs memory) {
        return protocolParametersArgs;
    }

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

    /// @return `Opium.Core`
    function getCore() external view returns (address) {
        return address(protocolAddressesArgs.core);
    }

    /// @notice It returns whether a given address is allowed to manage Opium.Core ERC20 balances
    function isCoreSpenderWhitelisted(address _address) external view returns (bool) {
        return coreSpenderWhitelist[_address];
    }

    /// @notice It returns true if the protocol is globally paused
    function isProtocolPaused() external view returns (bool) {
        return protocolPausabilityArgs.protocolGlobal;
    }

    /// @notice It returns whether Core.create() is currently paused
    /// @return true if protocol is globally paused or if protocolPositionCreation is paused
    function isProtocolPositionCreationPaused() external view returns (bool) {
        return protocolPausabilityArgs.protocolGlobal || protocolPausabilityArgs.protocolPositionCreation;
    }

    /// @notice It returns whether Core.mint() is currently paused
    /// @return true if protocol is globally paused or if protocolPositionMinting is paused
    function isProtocolPositionMintPaused() external view returns (bool) {
        return protocolPausabilityArgs.protocolGlobal || protocolPausabilityArgs.protocolPositionMinting;
    }

    /// @notice It returns whether Core.redeem() is currently paused
    /// @return true if protocol is globally paused or if protocolPositionRedemption is paused
    function isProtocolPositionRedemptionPaused() external view returns (bool) {
        return protocolPausabilityArgs.protocolGlobal || protocolPausabilityArgs.protocolPositionRedemption;
    }

    /// @notice It returns whether Core.execute() is currently paused
    /// @return true if protocol is globally paused or if protocolPositionExecution is paused
    function isProtocolPositionExecutionPaused() external view returns (bool) {
        return protocolPausabilityArgs.protocolGlobal || protocolPausabilityArgs.protocolPositionExecution;
    }

    /// @notice It returns whether Core.cancel() is currently paused
    /// @return true if protocol is globally paused or if protocolPositionCancellation is paused
    function isProtocolPositionCancellationPaused() external view returns (bool) {
        return protocolPausabilityArgs.protocolGlobal || protocolPausabilityArgs.protocolPositionCancellation;
    }

    /// @notice It returns whether Core.execute() is currently paused
    /// @return true if protocol is globally paused or if protocolReserveClaim is paused
    function isProtocolReserveClaimPaused() external view returns (bool) {
        return protocolPausabilityArgs.protocolGlobal || protocolPausabilityArgs.protocolReserveClaim;
    }
}
