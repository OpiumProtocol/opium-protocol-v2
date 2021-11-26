# RegistryStorage

contracts/core/registry/RegistryStorage.sol

> Notice: Error codes: {check the ./Registry.sol contract}

## *event* RoleAdminChanged

***RegistryStorage.RoleAdminChanged(role, previousAdminRole, newAdminRole) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| previousAdminRole | bytes32 | indexed |
| newAdminRole | bytes32 | indexed |



## *event* RoleGranted

***RegistryStorage.RoleGranted(role, account, sender) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| account | address | indexed |
| sender | address | indexed |



## *event* RoleRevoked

***RegistryStorage.RoleRevoked(role, account, sender) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| account | address | indexed |
| sender | address | indexed |



## *function* DEFAULT_ADMIN_ROLE

***RegistryStorage.DEFAULT_ADMIN_ROLE() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bytes32 |  |



## *function* getRoleAdmin

***RegistryStorage.getRoleAdmin(role) view***

> Details: Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role's admin, use {_setRoleAdmin}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bytes32 |  |



## *function* grantRole

***RegistryStorage.grantRole(role, account) ***

> Details: Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``'s admin role.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* hasRole

***RegistryStorage.hasRole(role, account) view***

> Details: Returns `true` if `account` has been granted `role`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* renounceRole

***RegistryStorage.renounceRole(role, account) ***

> Details: Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function's purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* revokeRole

***RegistryStorage.revokeRole(role, account) ***

> Details: Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``'s admin role.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* supportsInterface

***RegistryStorage.supportsInterface(interfaceId) view***

> Details: See {IERC165-supportsInterface}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| interfaceId | bytes4 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |


