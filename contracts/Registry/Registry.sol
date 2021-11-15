pragma solidity 0.8.5;

import "./RegistryStorageUpgradeable.sol";
import "../Lib/LibRoles.sol";
import "../Interface/IOpiumProxyFactory.sol";
import "../Interface/ISyntheticAggregator.sol";
import "../Interface/IOracleAggregator.sol";
import "../Interface/ITokenSpender.sol";
import "../Interface/ICore.sol";

/**
    Error codes:
    - R1 = ERROR_REGISTRY_ONLY_PROTOCOL_REGISTER_ROLE
    - R2 = ERROR_REGISTRY_ONLY_GUARDIAN
    - R3 = ERROR_REGISTRY_ONLY_WHITELISTER_ROLE
    - R4 = ERROR_REGISTRY_ONLY_PARAMETER_SETTER_ROLE
    - R5 = ERROR_REGISTRY_NULL_PROTOCOL_ADDRESS
    - R6 = ERROR_REGISTRY_ALREADY_PAUSED
    - R7 = ERROR_REGISTRY_NOT_PAUSED
 */

contract RegistryUpgradeable is RegistryStorageUpgradeable {
    //add events
    event LogOpiumCommissionChange(uint256 _opiumCommission);
    event LogNoDataCancellationPeriodChange(uint256 _noDataCancellationPeriod);
    event LogWhitelistAccount(address _whitelisted);
    event LogWhitelistAccountRemoved(address _whitelisted);

    /// @notice it is called only once upon deployment of the contract. It initializes the registry storage with the given governor address as the admin role.
    /// @dev Calls RegistryStorageUpgradeable.__RegistryStorage__init
    /// @param _governor address of the governance account which will be assigned all the roles included in the LibRoles library and the OpenZeppelin AccessControl.DEFAULT_ADMIN_ROLE
    function initialize(address _governor) external initializer {
        __RegistryStorage__init(_governor);
    }

    /// @notice it allows the PROTOCOL_REGISTER role to set the addresses of Opium Protocol's contracts
    /// @dev the contracts' addresses are set using their respective interfaces
    /// @param _opiumProxyFactory address of Opium.OpiumProxyFactory
    /// @param _core address of Opium.Core
    /// @param _oracleAggregator address of Opium.OracleAggregator
    /// @param _syntheticAggregator address of Opium.SyntheticAggregator
    /// @param _tokenSpender address of Opium.TokenSpender
    /// @param _protocolFeeReceiver address of the recipient of Opium Protocol's fees
    function registerProtocol(
        address _opiumProxyFactory,
        address _core,
        address _oracleAggregator,
        address _syntheticAggregator,
        address _tokenSpender,
        address _protocolFeeReceiver
    ) external onlyProtocolRegister {
        require(
            _opiumProxyFactory != address(0) &&
                _core != address(0) &&
                _oracleAggregator != address(0) &&
                _syntheticAggregator != address(0) &&
                _tokenSpender != address(0) &&
                _protocolFeeReceiver != address(0),
            "R5"
        );

        protocolAddressesArgs = RegistryEntities.ProtocolAddressesArgs({
            opiumProxyFactory: IOpiumProxyFactory(_opiumProxyFactory),
            core: ICore(_core),
            oracleAggregator: IOracleAggregator(_oracleAggregator),
            syntheticAggregator: ISyntheticAggregator(_syntheticAggregator),
            tokenSpender: ITokenSpender(_tokenSpender),
            protocolFeeReceiver: _protocolFeeReceiver
        });
    }

    // SETTERS

    /// @notice allows the GUARDIAN role to pause the Opium Protocol
    /// @dev it fails if the protocol is already paused
    function pause() external onlyGuardian {
        require(protocolParametersArgs.paused == false, "R6"); //already paused
        protocolParametersArgs.paused = true;
    }

    /// @notice allows the GUARDIAN role to unpause the Opium Protocol
    /// @dev it fails if the protocol is not paused
    function unpause() external onlyGuardian {
        require(protocolParametersArgs.paused == true, "R7"); //not paused
        protocolParametersArgs.paused = false;
    }

    /// @notice it allows the WHITELISTER role to add an address to the whitelist
    function addToWhitelist(address _whitelisted) external onlyWhitelister {
        coreSpenderWhitelist[_whitelisted] = true;
        emit LogWhitelistAccount(_whitelisted);
    }

    /// @notice it allows the WHITELISTER role to remove an address from the whitelist
    function removeFromWhitelist(address _whitelisted) external onlyWhitelister {
        delete coreSpenderWhitelist[_whitelisted];
        emit LogWhitelistAccountRemoved(_whitelisted);
    }

    /// @notice allows the COMMISSIONER role to change the protocolReceiver's fee
    function setOpiumCommissionPart(uint8 _protocolCommissionPart) external onlyParameterSetter {
        protocolParametersArgs.protocolCommissionPart = _protocolCommissionPart;
        emit LogOpiumCommissionChange(_protocolCommissionPart);
    }

    /// @notice allows the COMMISSIONER role to change the noDataCancellationPeriod (the timeframe after which a derivative can be cancelled if the oracle has not provided any data)
    function setNoDataCancellationPeriod(uint32 _noDataCancellationPeriod) external onlyParameterSetter {
        protocolParametersArgs.noDataCancellationPeriod = _noDataCancellationPeriod;
        emit LogNoDataCancellationPeriodChange(_noDataCancellationPeriod);
    }

    // GETTERS

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

    /// @notice Returns address of Opium.OracleAggregator
    function getOracleAggregator() external view returns (address) {
        return address(protocolAddressesArgs.oracleAggregator);
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
