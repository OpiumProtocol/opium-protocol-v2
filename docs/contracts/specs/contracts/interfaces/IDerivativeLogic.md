# IDerivativeLogic

contracts/interfaces/IDerivativeLogic.sol

> Title: Opium.Interface.IDerivativeLogic is an interface that every syntheticId should implement

## *event* LogMetadataSet

***IDerivativeLogic.LogMetadataSet(metadata) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| metadata | string | not indexed |



## *function* allowThirdpartyExecution

***IDerivativeLogic.allowThirdpartyExecution(_allow) ***

> Notice: Sets whether thirds parties are allowed or not to execute derivative's on msg.sender's behalf

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _allow | bool | bool Flag for execution allowance |



## *function* getAuthorAddress

***IDerivativeLogic.getAuthorAddress() view***

> Notice: Returns syntheticId author address for Opium commissions

Outputs

| **name** | **type** | **description** |
|-|-|-|
| authorAddress | address | address The address of syntheticId address |



## *function* getAuthorCommission

***IDerivativeLogic.getAuthorCommission() view***

> Notice: Returns syntheticId author commission in base of COMMISSION_BASE

Outputs

| **name** | **type** | **description** |
|-|-|-|
| commission | uint256 | uint256 Author commission |



## *function* getExecutionPayout

***IDerivativeLogic.getExecutionPayout(_derivative, _result) view***

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

***IDerivativeLogic.getMargin(_derivative) view***

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

***IDerivativeLogic.getSyntheticIdName() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string | Returns the custom name of a derivative ticker which will be used as part of the name of its positions |



## *function* thirdpartyExecutionAllowed

***IDerivativeLogic.thirdpartyExecutionAllowed(_derivativeOwner) view***

> Notice: Returns whether thirdparty could execute on derivative's owner's behalf

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeOwner | address | address Derivative owner address |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | Returns boolean whether _derivativeOwner allowed third party execution |



## *function* validateInput

***IDerivativeLogic.validateInput(_derivative) view***

> Notice: Validates ticker

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | Derivative Instance of derivative to validate |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | Returns boolean whether ticker is valid |


