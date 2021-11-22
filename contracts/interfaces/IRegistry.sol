pragma solidity 0.8.5;
import "../core/registry/RegistryEntities.sol";

interface IRegistry {
    function initialize(address _governor) external;

    function setProtocolAddresses(
        address _opiumProxyFactory,
        address _core,
        address _oracleAggregator,
        address _syntheticAggregator,
        address _tokenSpender
    ) external;

    function setProtocolExecutionFeeReceiver(address _executionFeeRecipient) external;

    function setProtocolRedemptionFeeReceiver(address _redemptionFeeRecipient) external;

    function setDerivativeAuthorExecutionFeeCap(uint32 _executionFeeCap) external;

    function setDerivativeAuthorRedemptionFee(uint32 _redemptionFee) external;

    function setProtocolFeePart(uint32 _protocolFeePart) external;

    function setNoDataCancellationPeriod(uint32 _noDataCancellationPeriod) external;

    function pause() external;

    function unpause() external;

    function pauseProtocolPositionCreation() external;

    function pauseProtocolPositionMint() external;

    function pauseProtocolPositionExecuted() external;

    function pauseProtocolPositionRedemption() external;

    function pauseProtocolPositionCancellation() external;

    function pauseProtocolReserveClaim() external;

    function addToWhitelist(address _whitelisted) external;

    function removeFromWhitelist(address _whitelisted) external;

    function getProtocolParameters() external view returns (RegistryEntities.ProtocolParametersArgs memory);

    function getProtocolAddresses() external view returns (RegistryEntities.ProtocolAddressesArgs memory);

    function isRegistryManager(address _address) external view returns (bool);

    function getCore() external view returns (address);

    function isCoreSpenderWhitelisted(address _address) external view returns (bool);

    function isProtocolPaused() external view returns (bool);

    function isProtocolPositionCreationPaused() external view returns (bool);

    function isProtocolPositionMintPaused() external view returns (bool);

    function isProtocolPositionRedemptionPaused() external view returns (bool);

    function isProtocolPositionExecutionPaused() external view returns (bool);

    function isProtocolPositionCancellationPaused() external view returns (bool);

    function isProtocolReserveClaimPaused() external view returns (bool);
}
