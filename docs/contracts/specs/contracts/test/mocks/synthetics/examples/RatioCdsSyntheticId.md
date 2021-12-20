# RatioCdsSyntheticId

contracts/test/mocks/synthetics/examples/RatioCdsSyntheticId.sol

## *constructor*

***constructor(_author, _commission)***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _author | address |  |
| _commission | uint256 |  |



## *event* LogMetadataSet

***RatioCdsSyntheticId.LogMetadataSet(metadata) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| metadata | string | not indexed |



## *event* OwnershipTransferred

***RatioCdsSyntheticId.OwnershipTransferred(previousOwner, newOwner) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| previousOwner | address | indexed |
| newOwner | address | indexed |



## *function* TRIGGER_BASE

***RatioCdsSyntheticId.TRIGGER_BASE() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* allowThirdpartyExecution

***RatioCdsSyntheticId.allowThirdpartyExecution() ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* getAuthorAddress

***RatioCdsSyntheticId.getAuthorAddress() view***

> Notice: Getter for syntheticId author address

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address | address syntheticId author address |



## *function* getAuthorCommission

***RatioCdsSyntheticId.getAuthorCommission() view***

> Notice: Getter for syntheticId author commission

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 | uint26 syntheticId author commission |



## *function* getExecutionPayout

***RatioCdsSyntheticId.getExecutionPayout(_derivative, _result) ***

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

***RatioCdsSyntheticId.getMargin(_derivative) ***

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

***RatioCdsSyntheticId.getSyntheticIdName() ***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string | Returns the custom name of a derivative ticker which will be used as part of the name of its positions |



## *function* owner

***RatioCdsSyntheticId.owner() view***

> Details: Returns the address of the current owner.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* renounceOwnership

***RatioCdsSyntheticId.renounceOwnership() ***

> Details: Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.



## *function* setAuthorAddress

***RatioCdsSyntheticId.setAuthorAddress(_author) ***

> Notice: GOVERNANCE 

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _author | address |  |



## *function* setAuthorCommission

***RatioCdsSyntheticId.setAuthorCommission(_commission) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _commission | uint256 |  |



## *function* thirdpartyExecutionAllowed

***RatioCdsSyntheticId.thirdpartyExecutionAllowed() ***

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

***RatioCdsSyntheticId.transferOwnership(newOwner) ***

> Details: Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| newOwner | address |  |



## *function* validateInput

***RatioCdsSyntheticId.validateInput(_derivative) view***

> Notice: Validates ticker

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | Derivative Instance of derivative to validate |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | Returns boolean whether ticker is valid |


