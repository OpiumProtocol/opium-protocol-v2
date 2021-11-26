# RegistryManager

contracts/core/base/RegistryManager.sol

> Notice: Error codes: - M1 = ERROR_REGISTRY_MANAGER_ONLY_REGISTRY_MANAGER_ROLE - M2 = ERROR_REGISTRY_MANAGER_ONLY_CORE_CONFIGURATION_UPDATER_ROLE

## *event* LogRegistryChanged

***RegistryManager.LogRegistryChanged(_changer, _newRegistryAddress) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _changer | address | indexed |
| _newRegistryAddress | address | indexed |



## *function* getRegistry

***RegistryManager.getRegistry() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* setRegistry

***RegistryManager.setRegistry(_registry) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _registry | address |  |


