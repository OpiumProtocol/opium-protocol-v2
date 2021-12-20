# IOracleAggregator

contracts/interfaces/IOracleAggregator.sol

## *function* __callback

***IOracleAggregator.__callback(timestamp, data) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| timestamp | uint256 |  |
| data | uint256 |  |



## *function* getData

***IOracleAggregator.getData(oracleId, timestamp) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| oracleId | address |  |
| timestamp | uint256 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
| dataResult | uint256 |  |



## *function* hasData

***IOracleAggregator.hasData(oracleId, timestamp) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| oracleId | address |  |
| timestamp | uint256 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |


