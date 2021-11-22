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
        // max fee that derivative author can set
        uint32 derivativeAuthorExecutionFeeCap;
        // fixed fee that the derivative author receives for each redemption of market neutral positions
        uint32 derivativeAuthorRedemptionFee;
        // Represents which part of `syntheticId` author commissions goes to opium
        uint32 protocolCommissionPart;
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

    struct ProtocolPausabilityArgs {
        // if true, all the protocol's entry-points are paused
        bool protocolGlobal;
        // if true, no new positions can be created
        bool protocolPositionCreation;
        // if true, no new positions can be minted
        bool protocolPositionMinting;
        // if true,no new positions can be redeemed
        bool protocolPositionRedemption;
        // if true, no new positions can be executed
        bool protocolPositionExecution;
        // if true, no new positions can be cancelled
        bool protocolPositionCancellation;
        // if true, no accrued reserves can be claimed
        bool protocolReserveClaim;
    }
}
