# OptionCallSyntheticIdMock

contracts/test/mocks/synthetics/OptionCallSyntheticIdMock.sol

## *constructor*

***constructor()***



## *event* LogMetadataSet

***OptionCallSyntheticIdMock.LogMetadataSet(metadata) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| metadata | string | not indexed |



## *function* allowThirdpartyExecution

***OptionCallSyntheticIdMock.allowThirdpartyExecution(allow) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| allow | bool |  |



## *function* getAuthorAddress

***OptionCallSyntheticIdMock.getAuthorAddress() view***

> Notice: Getter for syntheticId author address

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address | address syntheticId author address |



## *function* getAuthorCommission

***OptionCallSyntheticIdMock.getAuthorCommission() view***

> Notice: Getter for syntheticId author commission

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 | uint26 syntheticId author commission |



## *function* getExecutionPayout

***OptionCallSyntheticIdMock.getExecutionPayout(_derivative, _result) view***

> Notice: Calculates payout for derivative execution

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | Derivative Instance of derivative |
| _result | uint256 | uint256 Data retrieved from oracleId on the maturity |

Outputs

| **name** | **type** | **description** |
|-|-|-|
| buyerPayout | uint256 | uint256 Payout in ratio for buyer (LONG position holder) |
| sellerPayout | uint256 | uint256 Payout in ratio for seller (SHORT position holder) |



## *function* getMargin

***OptionCallSyntheticIdMock.getMargin(_derivative) view***

> Notice: Calculates margin required for derivative creation

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | Derivative Instance of derivative |

Outputs

| **name** | **type** | **description** |
|-|-|-|
| buyerMargin | uint256 | uint256 Margin needed from buyer (LONG position) |
| sellerMargin | uint256 | uint256 Margin needed from seller (SHORT position) |



## *function* getSyntheticIdName

***OptionCallSyntheticIdMock.getSyntheticIdName() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string | Returns the custom name of a derivative ticker which will be used as part of the name of its positions |



## *function* thirdpartyExecutionAllowed

***OptionCallSyntheticIdMock.thirdpartyExecutionAllowed(derivativeOwner) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| derivativeOwner | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* validateInput

***OptionCallSyntheticIdMock.validateInput(_derivative) view***

> Notice: Validates ticker

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | Derivative Instance of derivative to validate |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | Returns boolean whether ticker is valid |


