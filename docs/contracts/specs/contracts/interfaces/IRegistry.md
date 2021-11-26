# IRegistry

contracts/interfaces/IRegistry.sol

## *function* addToWhitelist

***IRegistry.addToWhitelist(_whitelisted) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _whitelisted | address |  |



## *function* getCore

***IRegistry.getCore() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* getProtocolAddresses

***IRegistry.getProtocolAddresses() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple |  |



## *function* getProtocolParameters

***IRegistry.getProtocolParameters() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple |  |



## *function* initialize

***IRegistry.initialize(_governor) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _governor | address |  |



## *function* isCoreConfigurationUpdater

***IRegistry.isCoreConfigurationUpdater(_address) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _address | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isCoreSpenderWhitelisted

***IRegistry.isCoreSpenderWhitelisted(_address) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _address | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPaused

***IRegistry.isProtocolPaused() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPositionCancellationPaused

***IRegistry.isProtocolPositionCancellationPaused() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPositionCreationPaused

***IRegistry.isProtocolPositionCreationPaused() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPositionExecutionPaused

***IRegistry.isProtocolPositionExecutionPaused() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPositionMintingPaused

***IRegistry.isProtocolPositionMintingPaused() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPositionRedemptionPaused

***IRegistry.isProtocolPositionRedemptionPaused() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolReserveClaimPaused

***IRegistry.isProtocolReserveClaimPaused() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isRegistryManager

***IRegistry.isRegistryManager(_address) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _address | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* pause

***IRegistry.pause() ***



## *function* pauseProtocolPositionCancellation

***IRegistry.pauseProtocolPositionCancellation() ***



## *function* pauseProtocolPositionCreation

***IRegistry.pauseProtocolPositionCreation() ***



## *function* pauseProtocolPositionExecution

***IRegistry.pauseProtocolPositionExecution() ***



## *function* pauseProtocolPositionMinting

***IRegistry.pauseProtocolPositionMinting() ***



## *function* pauseProtocolPositionRedemption

***IRegistry.pauseProtocolPositionRedemption() ***



## *function* pauseProtocolReserveClaim

***IRegistry.pauseProtocolReserveClaim() ***



## *function* removeFromWhitelist

***IRegistry.removeFromWhitelist(_whitelisted) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _whitelisted | address |  |



## *function* setDerivativeAuthorExecutionFeeCap

***IRegistry.setDerivativeAuthorExecutionFeeCap(_derivativeAuthorExecutionFeeCap) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeAuthorExecutionFeeCap | uint32 |  |



## *function* setDerivativeAuthorRedemptionReservePart

***IRegistry.setDerivativeAuthorRedemptionReservePart(_derivativeAuthorRedemptionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeAuthorRedemptionReservePart | uint32 |  |



## *function* setNoDataCancellationPeriod

***IRegistry.setNoDataCancellationPeriod(_noDataCancellationPeriod) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _noDataCancellationPeriod | uint32 |  |



## *function* setProtocolAddresses

***IRegistry.setProtocolAddresses(_opiumProxyFactory, _core, _oracleAggregator, _syntheticAggregator, _tokenSpender) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _opiumProxyFactory | address |  |
| _core | address |  |
| _oracleAggregator | address |  |
| _syntheticAggregator | address |  |
| _tokenSpender | address |  |



## *function* setProtocolExecutionReserveClaimer

***IRegistry.setProtocolExecutionReserveClaimer(_protocolExecutionReserveClaimer) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolExecutionReserveClaimer | address |  |



## *function* setProtocolExecutionReservePart

***IRegistry.setProtocolExecutionReservePart(_protocolExecutionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolExecutionReservePart | uint32 |  |



## *function* setProtocolRedemptionReserveClaimer

***IRegistry.setProtocolRedemptionReserveClaimer(_protocolRedemptionReserveClaimer) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolRedemptionReserveClaimer | address |  |



## *function* setProtocolRedemptionReservePart

***IRegistry.setProtocolRedemptionReservePart(_protocolRedemptionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolRedemptionReservePart | uint32 |  |



## *function* unpause

***IRegistry.unpause() ***


