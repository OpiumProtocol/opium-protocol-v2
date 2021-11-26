# TestCoreUpgrade

contracts/test/upgradeability/TestCoreUpgrade.sol

> Title: Opium.Core contract creates positions, holds and distributes margin at the maturity

## *event* LogCancelled

***TestCoreUpgrade.LogCancelled(_positionOwner, _derivativeHash, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | indexed |
| _derivativeHash | bytes32 | indexed |
| _amount | uint256 | not indexed |



## *event* LogCreated

***TestCoreUpgrade.LogCreated(_buyer, _seller, _derivativeHash, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _buyer | address | indexed |
| _seller | address | indexed |
| _derivativeHash | bytes32 | indexed |
| _amount | uint256 | not indexed |



## *event* LogDerivativeHashCancelled

***TestCoreUpgrade.LogDerivativeHashCancelled(_positionOwner, _derivativeHash) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | indexed |
| _derivativeHash | bytes32 | indexed |



## *event* LogExecuted

***TestCoreUpgrade.LogExecuted(_positionsOwner, _positionAddress, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsOwner | address | indexed |
| _positionAddress | address | indexed |
| _amount | uint256 | not indexed |



## *event* LogMinted

***TestCoreUpgrade.LogMinted(_buyer, _seller, _derivativeHash, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _buyer | address | indexed |
| _seller | address | indexed |
| _derivativeHash | bytes32 | indexed |
| _amount | uint256 | not indexed |



## *event* LogRedeemed

***TestCoreUpgrade.LogRedeemed(_positionOwner, _derivativeHash, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | indexed |
| _derivativeHash | bytes32 | indexed |
| _amount | uint256 | not indexed |



## *event* LogRegistryChanged

***TestCoreUpgrade.LogRegistryChanged(_changer, _newRegistryAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _changer | address | indexed |
| _newRegistryAddress | address | indexed |



## *function* cancel

***TestCoreUpgrade.cancel(_positionsAddresses, _amounts) ***

> Notice: It cancels the specified amounts of a list of derivative's position { see Core._cancel for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[] | PositionTypes of positions to be cancelled |
| _amounts | uint256[] | uint256[] Amount of positions to cancel for each `positionAddress` |



## *function* cancel

***TestCoreUpgrade.cancel(_positionAddress, _amount) ***

> Notice: It cancels the specified amount of a derivative's position { see Core._cancel for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionAddress | address | PositionType of positions to be canceled |
| _amount | uint256 | uint256 Amount of positions to cancel |



## *function* claimReserves

***TestCoreUpgrade.claimReserves(_tokenAddress, _amount) ***

> Notice: It allows a reserves recipient to to claim the desired amount of accrued reserves

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _tokenAddress | address | address of the ERC20 token to withdraw |
| _amount | uint256 | uint256 amount of reserves to withdraw |



## *function* claimReserves

***TestCoreUpgrade.claimReserves(_tokenAddress) ***

> Notice: It allows a reseve recipient to claim their entire accrued reserves

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _tokenAddress | address | address of the ERC20 token to withdraw |



## *function* create

***TestCoreUpgrade.create(_derivative, _amount, _positionsOwners) ***

> Notice: It deploys and mints the two erc20 contracts representing a derivative's LONG and SHORT positions { see Core._create for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | LibDerivative.Derivative Derivative definition |
| _amount | uint256 | uint256 Amount of positions to create |
| _positionsOwners | address[2] | address[2] Addresses of buyer and seller [0] - buyer address [1] - seller address |



## *function* createAndMint

***TestCoreUpgrade.createAndMint(_derivative, _amount, _positionsOwners) ***

> Notice: It can either 1) deploy AND mint 2) only mint.It checks whether the ERC20 contracts representing the LONG and SHORT positions of the provided `LibDerivative.Derivative` have been deployed. If not, then it deploys the respective ERC20 contracts and mints the supplied _amount respectively to the provided buyer's and seller's accounts. If they have already been deployed, it only mints the provided _amount to the provided buyer's and seller's accounts.

> Details: if the position contracts have been deployed, it uses Core._create()if the position contracts have deployed, it uses Core._mint()

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivative | tuple | LibDerivative.Derivative Derivative definition |
| _amount | uint256 | uint256 Amount of LONG and SHORT positions create and/or mint |
| _positionsOwners | address[2] | address[2] Addresses of buyer and seller _positionsOwners[0] - buyer address -> receives LONG position _positionsOwners[1] - seller address -> receives SHORT position |



## *function* execute

***TestCoreUpgrade.execute(_positionAddress, _amount) ***

> Notice: Executes a single position of `msg.sender` with specified `positionAddress` { see Core._execute for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionAddress | address | address `positionAddress` of position that needs to be executed |
| _amount | uint256 | uint256 Amount of positions to execute |



## *function* execute

***TestCoreUpgrade.execute(_positionsAddresses, _amounts) ***

> Notice: Executes several positions of `msg.sender` with different `positionAddresses` { see Core._execute for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[] | address[] `positionAddresses` of positions that need to be executed |
| _amounts | uint256[] | uint256[] Amount of positions to execute for each `positionAddress` |



## *function* execute

***TestCoreUpgrade.execute(_positionsOwner, _positionsAddresses, _amounts) ***

> Notice: Executes several positions of `_positionsOwner` with different `positionAddresses` { see Core._execute for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsOwner | address | address Address of the owner of positions |
| _positionsAddresses | address[] | address[] `positionAddresses` of positions that need to be executed |
| _amounts | uint256[] | uint256[] Amount of positions to execute for each `positionAddresses` |



## *function* execute

***TestCoreUpgrade.execute(_positionOwner, _positionAddress, _amount) ***

> Notice: Executes a single position of `_positionsOwner` with specified `positionAddress` { see Core._execute for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | address Address of the owner of positions |
| _positionAddress | address | address `positionAddress` of positions that needs to be executed |
| _amount | uint256 | uint256 Amount of positions to execute |



## *function* getDerivativePayouts

***TestCoreUpgrade.getDerivativePayouts(_derivativeHash) view***

> Notice: It queries the buyer's and seller's payouts for a given derivativeif it returns [0, 0] then the derivative has not been executed yet

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 | bytes32 unique derivative identifier |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256[2] | uint256[2] tuple containing LONG and SHORT payouts |



## *function* getP2pDerivativeVaultFunds

***TestCoreUpgrade.getP2pDerivativeVaultFunds(_derivativeHash) view***

> Notice: It queries the amount of funds allocated for a given derivative

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 | bytes32 unique derivative identifier |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 | uint256 representing the remaining derivative's funds |



## *function* getProtocolAddresses

***TestCoreUpgrade.getProtocolAddresses() view***

> Notice: It returns Opium.Core's internal state of the protocol contracts' and recipients' addresses fetched from the Opium.Registry

> Details: {see RegistryEntities.sol for a description of the protocolAddressesArgs struct}

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple | ProtocolAddressesArgs struct including the protocol's main addresses - contracts and reseves recipients |



## *function* getProtocolParametersArgs

***TestCoreUpgrade.getProtocolParametersArgs() view***

> Notice: It returns Opium.Core's internal state of the protocol parameters fetched from the Opium.Registry

> Details: {see RegistryEntities.sol for a description of the ProtocolParametersArgs struct}

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple | ProtocolParametersArgs struct including the protocol's main parameters |



## *function* getRegistry

***TestCoreUpgrade.getRegistry() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* getReservesVaultBalance

***TestCoreUpgrade.getReservesVaultBalance(_reseveRecipient, _token) view***

> Notice: It returns the accrued reseves of a given address denominated in a specified token

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _reseveRecipient | address | address of the reseve recipient |
| _token | address | address of a token used as a reseve compensation |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 | uint256 amount of the accrued reseves denominated in the provided token |



## *function* initialize

***TestCoreUpgrade.initialize(_registry) ***

> Notice: It is called only once upon deployment of the contract. It sets the current Opium.Registry address and assigns the current protocol parameters stored in the Opium.Registry to the Core.protocolParametersArgs private variable {see RegistryEntities.sol for a description of the ProtocolParametersArgs struct}

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |



## *function* isDerivativeCancelled

***TestCoreUpgrade.isDerivativeCancelled(_derivativeHash) view***

> Notice: It checks whether a given derivative has been cancelled

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 | bytes32 unique derivative identifier |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | bool true if derivative has been cancelled, false if derivative has not been cancelled |



## *function* mint

***TestCoreUpgrade.mint(_amount, _positionsAddresses, _positionsOwners) ***

> Notice: This function mints the provided amount of LONG/SHORT positions to msg.sender for a previously deployed pair of LONG/SHORT ERC20 contracts { see Core._mint for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _amount | uint256 | uint256 Amount of positions to create |
| _positionsAddresses | address[2] | address[2] Addresses of buyer and seller [0] - LONG erc20 position address [1] - SHORT erc20 position address |
| _positionsOwners | address[2] | address[2] Addresses of buyer and seller _positionsOwners[0] - buyer address _positionsOwners[1] - seller address |



## *function* placeholder

***TestCoreUpgrade.placeholder() ***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* redeem

***TestCoreUpgrade.redeem(_positionsAddresses, _amount) ***

> Notice: Redeems a single market neutral position pair { see Core._redeem for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[2] | address[2] `_positionsAddresses` of the positions that need to be redeemed |
| _amount | uint256 | uint256 Amount of tokens to redeem |



## *function* redeem

***TestCoreUpgrade.redeem(_positionsAddresses, _amounts) ***

> Notice: Redeems several market neutral position pairs { see Core._redeem for the business logic description }

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionsAddresses | address[2][] | address[2][] `_positionsAddresses` of the positions that need to be redeemed |
| _amounts | uint256[] | uint256[] Amount of tokens to redeem for each position pair |



## *function* setRegistry

***TestCoreUpgrade.setRegistry(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |



## *function* updateProtocolAddresses

***TestCoreUpgrade.updateProtocolAddresses() ***

> Notice: Allows to sync the Core protocol's addresses with the Registry protocol's addresses in case the registry updates at least one of them

> Details: {see RegistryEntities.sol for a description of the protocolAddressesArgs struct}should be called immediately after the deployment of the contractonly accounts who have been assigned the CORE_CONFIGURATION_UPDATER_ROLE { See LibRoles.sol } should be able to call the function



## *function* updateProtocolParametersArgs

***TestCoreUpgrade.updateProtocolParametersArgs() ***

> Notice: It allows to update the Opium Protocol parameters according to the current state of the Opium.Registry

> Details: {see RegistryEntities.sol for a description of the ProtocolParametersArgs struct}should be called immediately after the deployment of the contractonly accounts who have been assigned the CORE_CONFIGURATION_UPDATER_ROLE { See LibRoles.sol } should be able to call the function


