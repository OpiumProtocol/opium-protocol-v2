# TestTokenSpenderUpgrade

contracts/test/upgradeability/TestTokenSpenderUpgrade.sol

## *event* LogRegistryChanged

***TestTokenSpenderUpgrade.LogRegistryChanged(_changer, _newRegistryAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _changer | address | indexed |
| _newRegistryAddress | address | indexed |



## *function* claimTokens

***TestTokenSpenderUpgrade.claimTokens(_token, _from, _to, _amount) ***

> Notice: Using this function whitelisted contracts could call ERC20 transfers

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _token | address | IERC20 Instance of token |
| _from | address | address Address from which tokens are transferred |
| _to | address | address Address of tokens receiver |
| _amount | uint256 | uint256 Amount of tokens to be transferred |



## *function* getRegistry

***TestTokenSpenderUpgrade.getRegistry() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* initialize

***TestTokenSpenderUpgrade.initialize(_registry) ***

> Notice: it is called only once upon deployment of the contract

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address | sets the address of the Opium.Registry |



## *function* placeholder

***TestTokenSpenderUpgrade.placeholder() ***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* setRegistry

***TestTokenSpenderUpgrade.setRegistry(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |


