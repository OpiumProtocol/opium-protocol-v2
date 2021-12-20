# SyntheticAggregator

contracts/core/SyntheticAggregator.sol

> Notice: Opium.SyntheticAggregator contract initialized, identifies and caches syntheticId sensitive data

## *event* LogRegistryChanged

***SyntheticAggregator.LogRegistryChanged(_changer, _newRegistryAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _changer | address | indexed |
| _newRegistryAddress | address | indexed |



## *event* LogSyntheticInit

***SyntheticAggregator.LogSyntheticInit(derivative, derivativeHash) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| derivative | tuple | indexed |
| derivativeHash | bytes32 | indexed |



## *function* getMargin

***SyntheticAggregator.getMargin(_derivativeHash, _derivative) ***

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

***SyntheticAggregator.getRegistry() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* getSyntheticCache

***SyntheticAggregator.getSyntheticCache(_derivativeHash, _derivative) ***

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

***SyntheticAggregator.initialize(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |



## *function* setRegistry

***SyntheticAggregator.setRegistry(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |


