# OptionCallDeliverySyntheticId

contracts/test/mocks/synthetics/examples/OptionCallDeliverySyntheticId.sol

## *constructor*

***constructor(_author, _commission)***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _author | address |  |
| _commission | uint256 |  |



## *event* LogMetadataSet

***OptionCallDeliverySyntheticId.LogMetadataSet(metadata) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| metadata | string | not indexed |



## *event* OwnershipTransferred

***OptionCallDeliverySyntheticId.OwnershipTransferred(previousOwner, newOwner) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| previousOwner | address | indexed |
| newOwner | address | indexed |



## *function* allowThirdpartyExecution

***OptionCallDeliverySyntheticId.allowThirdpartyExecution() ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* getAuthorAddress

***OptionCallDeliverySyntheticId.getAuthorAddress() view***

> Notice: Getter for syntheticId author address

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address | address syntheticId author address |



## *function* getAuthorCommission

***OptionCallDeliverySyntheticId.getAuthorCommission() view***

> Notice: Getter for syntheticId author commission

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 | uint26 syntheticId author commission |



## *function* getExecutionPayout

***OptionCallDeliverySyntheticId.getExecutionPayout(_derivative, _result) ***

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

***OptionCallDeliverySyntheticId.getMargin(_derivative) ***

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

***OptionCallDeliverySyntheticId.getSyntheticIdName() ***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string | Returns the custom name of a derivative ticker which will be used as part of the name of its positions |



## *function* owner

***OptionCallDeliverySyntheticId.owner() view***

> Details: Returns the address of the current owner.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* renounceOwnership

***OptionCallDeliverySyntheticId.renounceOwnership() ***

> Details: Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.



## *function* setAuthorAddress

***OptionCallDeliverySyntheticId.setAuthorAddress(_author) ***

> Notice: GOVERNANCE 

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _author | address |  |



## *function* setAuthorCommission

***OptionCallDeliverySyntheticId.setAuthorCommission(_commission) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _commission | uint256 |  |



## *function* thirdpartyExecutionAllowed

***OptionCallDeliverySyntheticId.thirdpartyExecutionAllowed() ***

> Notice: THIRDPARTY EXECUTION 

Arguments

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* transferOwnership

***OptionCallDeliverySyntheticId.transferOwnership(newOwner) ***

> Details: Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| newOwner | address |  |



## *function* validateInput

***OptionCallDeliverySyntheticId.validateInput(_derivative) view***

> Notice: Validates ticker

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | Derivative Instance of derivative to validate |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | Returns boolean whether ticker is valid |


