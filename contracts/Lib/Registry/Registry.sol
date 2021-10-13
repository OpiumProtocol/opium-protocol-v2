pragma solidity 0.8.5;

import "./RegistryStorageUpgradeable.sol";

contract RegistryUpgradeable is RegistryStorageUpgradeable {
    //add events
    event LogOpiumCommissionChange(address _committer, uint256 _opiumCommission);
    event LogOpiumFeeReceiverChange(address _committer, uint256 _opiumCommission);
    event LogNoDataCancellationPeriodChange(address _committer, address _whitelisted);
    event LogWhitelistAccount(address _committer, address _whitelisted);
    event LogWhitelistAccountRemoved(address _committer, address _whitelisted);

    function initialize(
        address _governor,
        address[] memory _longExecutors, 
        address[] memory _shortExecutors
    ) external initializer {
        __RegistryStorage__init(
        _governor,
        _longExecutors, 
        _shortExecutors
        );
    }

    function registerProtocol(
        address _opiumProxyFactory,
        address _core,
        address _oracleAggregator,
        address _syntheticAggregator,
        address _tokenSpender,
        address _protocolFeeReceiver
    ) external onlyGovernor {
        require(
            _opiumProxyFactory != address(0) &&
            _core != address(0) &&
            _oracleAggregator != address(0) &&
            _syntheticAggregator != address(0) &&
            _tokenSpender != address(0) &&
            _protocolFeeReceiver != address(0),
            ERROR_REGISTRY_CANT_BE_ZERO_ADDRESS
        );

        protocolAddressesArgs = RegistryEntities.ProtocolAddressesArgs({
            opiumProxyFactory: _opiumProxyFactory,
            core: _core,
            oracleAggregator: _oracleAggregator,
            syntheticAggregator: _syntheticAggregator,
            tokenSpender: _tokenSpender,
            protocolFeeReceiver: _protocolFeeReceiver
        });
    }

    function addToWhitelist(address _whitelisted) external onlyLongExecutor {
        whitelist[_whitelisted] = true;
    }

    function removeFromWhitelist(address _whitelisted) external onlyLongExecutor {
        delete whitelist[_whitelisted];
    }

    function setOpiumCommissionPart(uint8 _protocolCommissionPart) external onlyLongExecutor {
        protocolCommissionArgs.protocolCommissionPart = _protocolCommissionPart;
    }

    // GETTERS
    function getExecuteAndCancelLocalVars() external view returns(RegistryEntities.ExecuteAndCancelLocalVars memory) {
        return RegistryEntities.ExecuteAndCancelLocalVars({
            opiumProxyFactory: protocolAddressesArgs.opiumProxyFactory,
            oracleAggregator: protocolAddressesArgs.oracleAggregator,
            syntheticAggregator: protocolAddressesArgs.syntheticAggregator
        });
    }

    function getProtocolAddresses() external view returns(RegistryEntities.ProtocolAddressesArgs memory) {
        return protocolAddressesArgs;
    }

    /// @notice Returns address of Opium.OpiumProxyFactory
    /// @param result address Address of Opium.OpiumProxyFactory
    function getOpiumProxyFactory() external view returns (address result) {
        return protocolAddressesArgs.opiumProxyFactory;
    }

    /// @notice Returns address of Opium.Core
    /// @param result address Address of Opium.Core
    function getCore() external view returns (address result) {
        return protocolAddressesArgs.core;
    }

    /// @notice Returns address of Opium.OracleAggregator
    /// @param result address Address of Opium.OracleAggregator
    function getOracleAggregator() external view returns (address result) {
        return protocolAddressesArgs.oracleAggregator;
    }

    /// @notice Returns address of Opium.TokenSpender
    /// @param result address Address of Opium.TokenSpender
    function getTokenSpender() external view returns (address result) {
        return protocolAddressesArgs.tokenSpender;
    }

    /// @notice Returns address of Opium commission receiver
    /// @param result address Address of Opium commission receiver
    function getOpiumFeeReceiver() external view returns (address result) {
        return protocolAddressesArgs.protocolFeeReceiver;
    }

    function isWhitelisted(address _address) external view returns(bool) {
        return whitelist[_address];
    }

    function getNoDataCancellationPeriod() external view returns (uint256) {
        return protocolCommissionArgs.noDataCancellationPeriod;
    }

    function getProtocolCommissionParams() external view returns(RegistryEntities.ProtocolCommissionArgs memory) {
        return protocolCommissionArgs;
    }
}