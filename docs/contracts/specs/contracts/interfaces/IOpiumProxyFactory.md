# IOpiumProxyFactory

contracts/interfaces/IOpiumProxyFactory.sol

## *function* burn

***IOpiumProxyFactory.burn(_positionOwner, _positionAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address |  |
| _positionAddress | address |  |
| _amount | uint256 |  |



## *function* burnPair

***IOpiumProxyFactory.burnPair(_positionOwner, _longPositionAddress, _shortPositionAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address |  |
| _longPositionAddress | address |  |
| _shortPositionAddress | address |  |
| _amount | uint256 |  |



## *function* create

***IOpiumProxyFactory.create(_buyer, _seller, _amount, _derivativeHash, _derivative) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _buyer | address |  |
| _seller | address |  |
| _amount | uint256 |  |
| _derivativeHash | bytes32 |  |
| _derivative | tuple |  |



## *function* getImplementationAddress

***IOpiumProxyFactory.getImplementationAddress() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* initialize

***IOpiumProxyFactory.initialize(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |



## *function* mintPair

***IOpiumProxyFactory.mintPair(_buyer, _seller, _longPositionAddress, _shortPositionAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _buyer | address |  |
| _seller | address |  |
| _longPositionAddress | address |  |
| _shortPositionAddress | address |  |
| _amount | uint256 |  |


