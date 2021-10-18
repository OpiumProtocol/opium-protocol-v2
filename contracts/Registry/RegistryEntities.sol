pragma solidity 0.8.5;

import "../Interface/IOpiumProxyFactory.sol";
import "../Interface/ISyntheticAggregator.sol";
import "../Interface/IOracleAggregator.sol";

library RegistryEntities {
    struct ProtocolCommissionArgs {
        // Represents 100% base for commissions calculation
        uint32 derivativeAuthorCommissionBase;
        // Period of time after which ticker could be canceled if no data was provided to the `oracleId`
        uint32 noDataCancellationPeriod;
        // Represents 100% base for Opium commission
        uint8 protocolFeeCommissionBase;
        // Represents which part of `syntheticId` author commissions goes to opium
        uint8 protocolCommissionPart;
        // scaling factor
        uint8 precisionFactor;
        bool paused;
    }

    struct ProtocolAddressesArgs {
        // Address of Opium.Core contract
        address core;
        // Address of Opium.OpiumProxyFactory contract
        IOpiumProxyFactory opiumProxyFactory;
        // Address of Opium.OracleAggregator contract
        IOracleAggregator oracleAggregator;
        // Address of Opium.SyntheticAggregator contract
        ISyntheticAggregator syntheticAggregator;
        // Address of Opium.TokenSpender contract
        address tokenSpender;
        // Address of protocol commission receiver
        address protocolFeeReceiver;
    }

    struct ExecuteAndCancelLocalVars {
        IOpiumProxyFactory opiumProxyFactory;
        IOracleAggregator oracleAggregator;
        ISyntheticAggregator syntheticAggregator;
    }
}
