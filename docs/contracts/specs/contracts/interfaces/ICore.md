# ICore

contracts/interfaces/ICore.sol

## *function* cancel

***ICore.cancel(_positionsAddresses, _amounts) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[] |  |
| _amounts | uint256[] |  |



## *function* cancel

***ICore.cancel(_positionAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionAddress | address |  |
| _amount | uint256 |  |



## *function* claimReserves

***ICore.claimReserves(_tokenAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _tokenAddress | address |  |
| _amount | uint256 |  |



## *function* claimReserves

***ICore.claimReserves(_tokenAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _tokenAddress | address |  |



## *function* create

***ICore.create(_derivative, _amount, _positionsOwners) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple |  |
| _amount | uint256 |  |
| _positionsOwners | address[2] |  |



## *function* createAndMint

***ICore.createAndMint(_derivative, _amount, _positionsOwners, _derivativeAuthorCustomName) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple |  |
| _amount | uint256 |  |
| _positionsOwners | address[2] |  |
| _derivativeAuthorCustomName | string |  |



## *function* execute

***ICore.execute(_positionAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionAddress | address |  |
| _amount | uint256 |  |



## *function* execute

***ICore.execute(_positionsAddresses, _amounts) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[] |  |
| _amounts | uint256[] |  |



## *function* execute

***ICore.execute(_positionsOwner, _positionsAddresses, _amounts) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsOwner | address |  |
| _positionsAddresses | address[] |  |
| _amounts | uint256[] |  |



## *function* execute

***ICore.execute(_positionOwner, _positionAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address |  |
| _positionAddress | address |  |
| _amount | uint256 |  |



## *function* getDerivativePayouts

***ICore.getDerivativePayouts(_derivativeHash) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256[2] |  |



## *function* getP2pDerivativeVaultFunds

***ICore.getP2pDerivativeVaultFunds(_derivativeHash) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* getProtocolAddresses

***ICore.getProtocolAddresses() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple |  |



## *function* getProtocolParametersArgs

***ICore.getProtocolParametersArgs() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple |  |



## *function* getReservesVaultBalance

***ICore.getReservesVaultBalance(_reseveRecipient, _token) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _reseveRecipient | address |  |
| _token | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* initialize

***ICore.initialize(_governor) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _governor | address |  |



## *function* isDerivativeCancelled

***ICore.isDerivativeCancelled(_derivativeHash) view***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* mint

***ICore.mint(_amount, _positionsAddresses, _positionsOwners) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _amount | uint256 |  |
| _positionsAddresses | address[2] |  |
| _positionsOwners | address[2] |  |



## *function* redeem

***ICore.redeem(_positionsAddresses, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[2] |  |
| _amount | uint256 |  |



## *function* redeem

***ICore.redeem(_positionsAddresses, _amounts) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[2][] |  |
| _amounts | uint256[] |  |



## *function* updateProtocolAddresses

***ICore.updateProtocolAddresses() ***



## *function* updateProtocolParametersArgs

***ICore.updateProtocolParametersArgs() ***


