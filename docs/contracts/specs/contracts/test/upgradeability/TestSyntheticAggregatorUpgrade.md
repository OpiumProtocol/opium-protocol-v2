# TestSyntheticAggregatorUpgrade

contracts/test/upgradeability/TestSyntheticAggregatorUpgrade.sol

## *event* LogRegistryChanged

***TestSyntheticAggregatorUpgrade.LogRegistryChanged(_changer, _newRegistryAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _changer | address | indexed |
| _newRegistryAddress | address | indexed |



## *event* LogSyntheticInit

***TestSyntheticAggregatorUpgrade.LogSyntheticInit(derivative, derivativeHash) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| derivative | tuple | indexed |
| derivativeHash | bytes32 | indexed |



## *function* getMargin

***TestSyntheticAggregatorUpgrade.getMargin(_derivativeHash, _derivative) ***

> Notice: Initializes ticker, if was not initialized and returns buyer and seller margin from cache

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 | bytes32 hash of derivative |
| _derivative | tuple | Derivative Derivative itself |

Outputs

| **name** | **type** | **description** |
|-|-|-|
| buyerMargin | uint256 | uint256 Margin of buyer |
| sellerMargin | uint256 | uint256 Margin of seller |



## *function* getRegistry

***TestSyntheticAggregatorUpgrade.getRegistry() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* getSyntheticCache

***TestSyntheticAggregatorUpgrade.getSyntheticCache(_derivativeHash, _derivative) ***

> Notice: Initializes ticker, if was not initialized and returns `syntheticId` author address from cache

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 |  |
| _derivative | tuple |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple |  |



## *function* initialize

***TestSyntheticAggregatorUpgrade.initialize(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |



## *function* placeholder

***TestSyntheticAggregatorUpgrade.placeholder() ***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* setRegistry

***TestSyntheticAggregatorUpgrade.setRegistry(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |


