# Registry

contracts/core/registry/Registry.sol

> Notice: Error codes: - R1 = ERROR_REGISTRY_ONLY_PROTOCOL_ADDRESSES_SETTER_ROLE - R2 = ERROR_REGISTRY_ONLY_EXECUTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE - R3 = ERROR_REGISTRY_ONLY_REDEMPTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE - R4 = ERROR_REGISTRY_ONLY_EXECUTION_RESERVE_PART_SETTER_ROLE - R5 = ERROR_REGISTRY_ONLY_NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE - R6 = ERROR_REGISTRY_ONLY_GUARDIAN_ROLE - R7 = ERROR_REGISTRY_ONLY_WHITELISTER_ROLE - R8 = ERROR_REGISTRY_ONLY_DERIVATIVE_AUTHOR_EXECUTION_FEE_CAP_SETTER_ROLE - R9 = ERROR_REGISTRY_ONLY_REDEMPTION_RESERVE_PART_SETTER_ROLE - R10 = ERROR_REGISTRY_ALREADY_PAUSED - R11 = ERROR_REGISTRY_NOT_PAUSED - R12 = ERROR_REGISTRY_NULL_ADDRESS - R13 = ERROR_REGISTRY_ONLY_PARTIAL_CREATE_PAUSE_ROLE - R14 = ERROR_REGISTRY_ONLY_PARTIAL_MINT_PAUSE_ROLE - R15 = ERROR_REGISTRY_ONLY_PARTIAL_REDEEM_PAUSE_ROLE - R16 = ERROR_REGISTRY_ONLY_PARTIAL_EXECUTE_PAUSE_ROLE - R17 = ERROR_REGISTRY_ONLY_PARTIAL_CANCEL_PAUSE_ROLE - R18 = ERROR_REGISTRY_ONLY_PARTIAL_CLAIM_RESERVE_PAUSE_ROLE - R19 = ERROR_REGISTRY_ONLY_PROTOCOL_UNPAUSER_ROLE - R20 = ERROR_REGISTRY_INVALID_VALUE

## *event* LogDerivativeAuthorExecutionFeeCapChanged

***Registry.LogDerivativeAuthorExecutionFeeCapChanged(_setter, _derivativeAuthorExecutionFeeCap) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _derivativeAuthorExecutionFeeCap | uint32 | indexed |



## *event* LogDerivativeAuthorRedemptionReservePartChanged

***Registry.LogDerivativeAuthorRedemptionReservePartChanged(_setter, _derivativeAuthorRedemptionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _derivativeAuthorRedemptionReservePart | uint32 | indexed |



## *event* LogNoDataCancellationPeriodChanged

***Registry.LogNoDataCancellationPeriodChanged(_setter, _noDataCancellationPeriod) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _noDataCancellationPeriod | uint256 | indexed |



## *event* LogProtocolExecutionReserveClaimerChanged

***Registry.LogProtocolExecutionReserveClaimerChanged(_setter, _protocolExecutionReserveClaimer) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolExecutionReserveClaimer | address | indexed |



## *event* LogProtocolExecutionReservePartChanged

***Registry.LogProtocolExecutionReservePartChanged(_setter, _protocolExecutionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolExecutionReservePart | uint32 | indexed |



## *event* LogProtocolPausableStateChanged

***Registry.LogProtocolPausableStateChanged(_setter, _state, _role) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _state | bool | indexed |
| _role | bytes32 | indexed |



## *event* LogProtocolRedemptionReserveClaimerChanged

***Registry.LogProtocolRedemptionReserveClaimerChanged(_setter, _protocolRedemptionReserveClaimer) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolRedemptionReserveClaimer | address | indexed |



## *event* LogProtocolRedemptionReservePartChanged

***Registry.LogProtocolRedemptionReservePartChanged(_setter, _protocolRedemptionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolRedemptionReservePart | uint32 | indexed |



## *event* LogWhitelistAccountAdded

***Registry.LogWhitelistAccountAdded(_setter, _whitelisted) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _whitelisted | address | indexed |



## *event* LogWhitelistAccountRemoved

***Registry.LogWhitelistAccountRemoved(_setter, _unlisted) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _unlisted | address | indexed |



## *event* RoleAdminChanged

***Registry.RoleAdminChanged(role, previousAdminRole, newAdminRole) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| previousAdminRole | bytes32 | indexed |
| newAdminRole | bytes32 | indexed |



## *event* RoleGranted

***Registry.RoleGranted(role, account, sender) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| account | address | indexed |
| sender | address | indexed |



## *event* RoleRevoked

***Registry.RoleRevoked(role, account, sender) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| account | address | indexed |
| sender | address | indexed |



## *function* DEFAULT_ADMIN_ROLE

***Registry.DEFAULT_ADMIN_ROLE() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bytes32 |  |



## *function* addToWhitelist

***Registry.addToWhitelist(_whitelisted) ***

> Notice: It allows the WHITELISTER_ROLE to add an address to the whitelist

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _whitelisted | address |  |



## *function* getCore

***Registry.getCore() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address | `Opium.Core` |



## *function* getProtocolAddresses

***Registry.getProtocolAddresses() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple | RegistryEntities.ProtocolAddressesArgs struct that packs all the interfaces of the Opium Protocol |



## *function* getProtocolParameters

***Registry.getProtocolParameters() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple | RegistryEntities.getProtocolParameters struct that packs the protocol lifecycle parameters {see RegistryEntities comments} |



## *function* getRoleAdmin

***Registry.getRoleAdmin(role) view***

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

***Registry.grantRole(role, account) ***

> Details: Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``'s admin role.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* hasRole

***Registry.hasRole(role, account) view***

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



## *function* initialize

***Registry.initialize(_governor) ***

> Notice: it is called only once upon deployment of the contract. It initializes the DEFAULT_ADMIN_ROLE with the given governor address.it sets the default ProtocolParametersArgs protocol parameters

> Details: internally, it assigns all the setters roles to the DEFAULT_ADMIN_ROLE and it sets the initial protocol parameters

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _governor | address | address of the governance account which will be assigned all the roles included in the LibRoles library and the OpenZeppelin AccessControl.DEFAULT_ADMIN_ROLE |



## *function* isCoreConfigurationUpdater

***Registry.isCoreConfigurationUpdater(_address) view***

> Notice: Returns true if msg.sender has been assigned the CORE_CONFIGURATION_UPDATER_ROLE role

> Details: it is meant to be consumed by the RegistryManager module

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _address | address | address to be checked |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isCoreSpenderWhitelisted

***Registry.isCoreSpenderWhitelisted(_address) view***

> Notice: It returns whether a given address is allowed to manage Opium.Core ERC20 balances

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _address | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPaused

***Registry.isProtocolPaused() view***

> Notice: It returns true if the protocol is globally paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPositionCancellationPaused

***Registry.isProtocolPositionCancellationPaused() view***

> Notice: It returns whether Core.cancel() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionCancellation is paused |



## *function* isProtocolPositionCreationPaused

***Registry.isProtocolPositionCreationPaused() view***

> Notice: It returns whether Core.create() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionCreation is paused |



## *function* isProtocolPositionExecutionPaused

***Registry.isProtocolPositionExecutionPaused() view***

> Notice: It returns whether Core.execute() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionExecution is paused |



## *function* isProtocolPositionMintingPaused

***Registry.isProtocolPositionMintingPaused() view***

> Notice: It returns whether Core.mint() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionMinting is paused |



## *function* isProtocolPositionRedemptionPaused

***Registry.isProtocolPositionRedemptionPaused() view***

> Notice: It returns whether Core.redeem() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionRedemption is paused |



## *function* isProtocolReserveClaimPaused

***Registry.isProtocolReserveClaimPaused() view***

> Notice: It returns whether Core.execute() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolReserveClaim is paused |



## *function* isRegistryManager

***Registry.isRegistryManager(_address) view***

> Notice: Returns true if msg.sender has been assigned the REGISTRY_MANAGER_ROLE role

> Details: it is meant to be consumed by the RegistryManager module

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _address | address | address to be checked |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* pause

***Registry.pause() ***

> Notice: It allows the GUARDIAN role to pause the entire Opium Protocol

> Details: it fails if the entire protocol is already paused



## *function* pauseProtocolPositionCancellation

***Registry.pauseProtocolPositionCancellation() ***

> Notice: It allows the PARTIAL_CANCEL_PAUSE_ROLE role to pause the cancellation of positions

> Details: it fails if the cancellation of positions is paused



## *function* pauseProtocolPositionCreation

***Registry.pauseProtocolPositionCreation() ***

> Notice: It allows the PARTIAL_CREATE_PAUSE_ROLE role to pause the creation of positions

> Details: it fails if the creation of positions is paused



## *function* pauseProtocolPositionExecution

***Registry.pauseProtocolPositionExecution() ***

> Notice: It allows the PARTIAL_EXECUTE_PAUSE_ROLE role to pause the execution of positions

> Details: it fails if the execution of positions is paused



## *function* pauseProtocolPositionMinting

***Registry.pauseProtocolPositionMinting() ***

> Notice: It allows the PARTIAL_MINT_PAUSE_ROLE role to pause the minting of positions

> Details: it fails if the minting of positions is paused



## *function* pauseProtocolPositionRedemption

***Registry.pauseProtocolPositionRedemption() ***

> Notice: It allows the PARTIAL_REDEEM_PAUSE_ROLE role to pause the redemption of positions

> Details: it fails if the redemption of positions is paused



## *function* pauseProtocolReserveClaim

***Registry.pauseProtocolReserveClaim() ***

> Notice: It allows the PARTIAL_CLAIM_RESERVE_PAUSE_ROLE role to pause the reserves claims

> Details: it fails if the reserves claims are paused



## *function* removeFromWhitelist

***Registry.removeFromWhitelist(_whitelisted) ***

> Notice: It allows the WHITELISTER_ROLE to remove an address from the whitelist

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _whitelisted | address |  |



## *function* renounceRole

***Registry.renounceRole(role, account) ***

> Details: Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function's purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* revokeRole

***Registry.revokeRole(role, account) ***

> Details: Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``'s admin role.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* setDerivativeAuthorExecutionFeeCap

***Registry.setDerivativeAuthorExecutionFeeCap(_derivativeAuthorExecutionFeeCap) ***

> Notice: It allows the DERIVATIVE_AUTHOR_EXECUTION_FEE_CAP_SETTER_ROLE role to change max fee that derivative author can set

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeAuthorExecutionFeeCap | uint32 | must be less than 100% |



## *function* setDerivativeAuthorRedemptionReservePart

***Registry.setDerivativeAuthorRedemptionReservePart(_derivativeAuthorRedemptionReservePart) ***

> Notice: It allows the REDEMPTION_RESERVE_PART_SETTER_ROLE role to change the fixed part (percentage) that the derivative author receives for each redemption of market neutral positions

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeAuthorRedemptionReservePart | uint32 | must be less than 1% |



## *function* setNoDataCancellationPeriod

***Registry.setNoDataCancellationPeriod(_noDataCancellationPeriod) ***

> Notice: It allows the NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE role to change the noDataCancellationPeriod (the timeframe after which a derivative can be cancelled if the oracle has not provided any data)

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _noDataCancellationPeriod | uint32 |  |



## *function* setProtocolAddresses

***Registry.setProtocolAddresses(_opiumProxyFactory, _core, _oracleAggregator, _syntheticAggregator, _tokenSpender) ***

> Notice: It allows the PROTOCOL_ADDRESSES_SETTER_ROLE role to set the addresses of Opium Protocol's contracts

> Details: It must be called as part of the protocol's deployment setup after the core addresses have been deployedthe contracts' addresses are set using their respective interfaces

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _opiumProxyFactory | address | address of Opium.OpiumProxyFactory |
| _core | address | address of Opium.Core |
| _oracleAggregator | address | address of Opium.OracleAggregator |
| _syntheticAggregator | address | address of Opium.SyntheticAggregator |
| _tokenSpender | address | address of Opium.TokenSpender |



## *function* setProtocolExecutionReserveClaimer

***Registry.setProtocolExecutionReserveClaimer(_protocolExecutionReserveClaimer) ***

> Notice: It allows the EXECUTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE role to change the address of the recipient of execution protocol reserves

> Details: It must be called as part of the protocol's deployment setup after the core addresses have been deployedit must be a non-null address

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolExecutionReserveClaimer | address | address that will replace the current `protocolExecutionReserveClaimer` |



## *function* setProtocolExecutionReservePart

***Registry.setProtocolExecutionReservePart(_protocolExecutionReservePart) ***

> Notice: It allows the EXECUTION_RESERVE_PART_SETTER_ROLE role to change part of derivative author reserves originated from derivative executions go to the protocol reserves

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolExecutionReservePart | uint32 | must be less than 100% |



## *function* setProtocolRedemptionReserveClaimer

***Registry.setProtocolRedemptionReserveClaimer(_protocolRedemptionReserveClaimer) ***

> Notice: It allows the REDEMPTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE role to change the address of the recipient of redemption protocol reserves

> Details: It must be called as part of the protocol's deployment setup after the core addresses have been deployedit must be a non-null address

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolRedemptionReserveClaimer | address | address that will replace the current `protocolAddressesArgs.protocolRedemptionReserveClaimer` |



## *function* setProtocolRedemptionReservePart

***Registry.setProtocolRedemptionReservePart(_protocolRedemptionReservePart) ***

> Notice: It allows the REDEMPTION_RESERVE_PART_SETTER_ROLE role to change part of derivative author reserves originated from redemption of market neutral positions go to the protocol reserves

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolRedemptionReservePart | uint32 | must be less than 100% |



## *function* supportsInterface

***Registry.supportsInterface(interfaceId) view***

> Details: See {IERC165-supportsInterface}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| interfaceId | bytes4 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* unpause

***Registry.unpause() ***

> Notice: It allows the PROTOCOL_UNPAUSER_ROLE to unpause the Opium Protocol


