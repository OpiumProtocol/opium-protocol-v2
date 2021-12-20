# OpiumProxyFactory

contracts/core/OpiumProxyFactory.sol

> Title: Opium.OpiumProxyFactory contract manages the deployment of ERC20 LONG/SHORT positions for a given `LibDerivative.Derivative` structure and it's responsible for minting and burning positions according to the parameters supplied by `Opium.Core`

## *event* LogPositionTokenPair

***OpiumProxyFactory.LogPositionTokenPair(_derivativeHash, _longPositionAddress, _shortPositionAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 | indexed |
| _longPositionAddress | address | indexed |
| _shortPositionAddress | address | indexed |



## *event* LogRegistryChanged

***OpiumProxyFactory.LogRegistryChanged(_changer, _newRegistryAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _changer | address | indexed |
| _newRegistryAddress | address | indexed |



## *function* burn

***OpiumProxyFactory.burn(_positionOwner, _positionAddress, _amount) ***

> Notice: it burns specified amount of a specific position tokens on behalf of a specified ownerit is consumed by Opium.Core to execute or cancel a specific position type

> Details: if no position has been deployed at the provided address, it is expected to revert

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | address of the owner of the specified position token |
| _positionAddress | address | address of the position token to be burnt |
| _amount | uint256 | amount of position tokens to be minted to the _positionHolder |



## *function* burnPair

***OpiumProxyFactory.burnPair(_positionOwner, _longPositionAddress, _shortPositionAddress, _amount) ***

> Notice: It burns the specified amount of LONG/SHORT position tokens on behalf of a specified ownerIt is consumed by Opium.Core to redeem market neutral position pairs

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | address of the owner of the LONG/SHORT position tokens |
| _longPositionAddress | address | address of the deployed LONG position token |
| _shortPositionAddress | address | address of the deployed SHORT position token |
| _amount | uint256 | amount of position tokens to be minted to the _positionHolder |



## *function* create

***OpiumProxyFactory.create(_buyer, _seller, _amount, _derivativeHash, _derivative) ***

> Notice: It creates a specified amount of LONG/SHORT position tokens on behalf of the buyer(LONG) and seller(SHORT) - the specified amount can be 0 in which case the ERC20 contract of the position tokens will only be deployed

> Details: if either of the LONG or SHORT position contracts already exists then it is expected to fail

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _buyer | address | address of the recipient of the LONG position tokens |
| _seller | address | address of the recipient of the SHORT position tokens |
| _amount | uint256 | amount of position tokens to be minted to the _positionHolder |
| _derivativeHash | bytes32 | bytes32 hash of `LibDerivative.Derivative` |
| _derivative | tuple | LibDerivative.Derivative Derivative definition |



## *function* getImplementationAddress

***OpiumProxyFactory.getImplementationAddress() view***

> Notice: It retrieves the information about the underlying derivative

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address | _opiumPositionTokenParams OpiumPositionTokenParams struct which contains `LibDerivative.Derivative` schema of the derivative, the ` LibDerivative.PositionType` of the present ERC20 token and the bytes32 hash `derivativeHash` of the `LibDerivative.Derivative` derivative |



## *function* getRegistry

***OpiumProxyFactory.getRegistry() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* initialize

***OpiumProxyFactory.initialize(_registry) ***

> Notice: It is called only once upon deployment of the contract

> Details: It sets the the address of the implementation of the OpiumPositionToken contract which will be used for the factory-deployment of erc20 positions via the minimal proxy contract

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address | address of Opium.Registry |



## *function* mintPair

***OpiumProxyFactory.mintPair(_buyer, _seller, _longPositionAddress, _shortPositionAddress, _amount) ***

> Notice: it creates a specified amount of LONG/SHORT position tokens on behalf of the buyer(LONG) and seller(SHORT) - the specified amount can be 0 in which case the ERC20 contract of the position tokens will only be deployed

> Details: if LONG or SHORT position contracts have not been deployed yet at the provided addresses then it is expected to fail

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _buyer | address | address of the recipient of the LONG position tokens |
| _seller | address | address of the recipient of the SHORT position tokens |
| _longPositionAddress | address | address of the deployed LONG position token |
| _shortPositionAddress | address | address of the deployed SHORT position token |
| _amount | uint256 | amount of position tokens to be minted to the _positionHolder |



## *function* setRegistry

***OpiumProxyFactory.setRegistry(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |


