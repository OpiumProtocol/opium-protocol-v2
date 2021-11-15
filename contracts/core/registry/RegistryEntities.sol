pragma solidity 0.8.5;

import "../../interfaces/IOpiumProxyFactory.sol";
import "../../interfaces/ISyntheticAggregator.sol";
import "../../interfaces/IOracleAggregator.sol";
import "../../interfaces/ITokenSpender.sol";
import "../../interfaces/ICore.sol";

library RegistryEntities {
    struct ProtocolParametersArgs {
        // Period of time after which ticker could be canceled if no data was provided to the `oracleId`
        uint32 noDataCancellationPeriod;
        // Represents 100% base for commissions calculation
        uint32 derivativeAuthorCommissionBase;
        // Represents 100% base for the total fee applied to the profitable execution of a derivative position
        uint8 protocolExecutionFeeCommissionBase;
        // Represents 100% base for the total fee applied to the successful redemption of a market neutral position
        uint8 protocolRedemptionFeeCommissionBase;
        // Represents which part of `syntheticId` author commissions goes to opium
        uint8 protocolCommissionPart;
        // Represents whether the protocol is paused
        bool paused;
    }

    struct ProtocolAddressesArgs {
        // Address of Opium.Core contract
        ICore core;
        // Address of Opium.OpiumProxyFactory contract
        IOpiumProxyFactory opiumProxyFactory;
        // Address of Opium.OracleAggregator contract
        IOracleAggregator oracleAggregator;
        // Address of Opium.SyntheticAggregator contract
        ISyntheticAggregator syntheticAggregator;
        // Address of Opium.TokenSpender contract
        ITokenSpender tokenSpender;
        // Address of the recipient of Opium Protocol's fees originated from the profitable execution of a derivative's position
        address protocolExecutionFeeReceiver;
        // Address of the recipient of Opium Protocol's fees originated from the successful redemption of a market neutral position
        address protocolRedemptionFeeReceiver;
    }
}
