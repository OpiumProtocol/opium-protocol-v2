# TestOracleAggregatorUpgrade

contracts/test/upgradeability/TestOracleAggregatorUpgrade.sol

## *event* LogDataProvided

***TestOracleAggregatorUpgrade.LogDataProvided(_oracleId, _timestamp, _data) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _oracleId | address | indexed |
| _timestamp | uint256 | indexed |
| _data | uint256 | indexed |



## *function* __callback

***TestOracleAggregatorUpgrade.__callback(timestamp, data) ***

> Notice: Receives and caches data from `msg.sender`

Arguments

| **name** | **type** | **description** |
|-|-|-|
| timestamp | uint256 | uint256 Timestamp of data |
| data | uint256 | uint256 Data itself |



## *function* getData

***TestOracleAggregatorUpgrade.getData(oracleId, timestamp) view***

> Notice: Returns cached data if they exist, or reverts with an error

Arguments

| **name** | **type** | **description** |
|-|-|-|
| oracleId | address | address Address of the `oracleId` smart contract |
| timestamp | uint256 | uint256 Timestamp at which data were requested |

Outputs

| **name** | **type** | **description** |
|-|-|-|
| dataResult | uint256 | uint256 Cached data provided by `oracleId` |



## *function* hasData

***TestOracleAggregatorUpgrade.hasData(oracleId, timestamp) view***

> Notice: Getter for dataExist mapping

Arguments

| **name** | **type** | **description** |
|-|-|-|
| oracleId | address | address Address of the `oracleId` smart contract |
| timestamp | uint256 | uint256 Timestamp at which data were requested |

Outputs

| **name** | **type** | **description** |
|-|-|-|
| result | bool |  |



## *function* placeholder

***TestOracleAggregatorUpgrade.placeholder() ***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |


