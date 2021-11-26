# TestRegistryUpgrade

contracts/test/upgradeability/TestRegistryUpgrade.sol

## *event* LogDerivativeAuthorExecutionFeeCapChanged

***TestRegistryUpgrade.LogDerivativeAuthorExecutionFeeCapChanged(_setter, _derivativeAuthorExecutionFeeCap) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _derivativeAuthorExecutionFeeCap | uint32 | indexed |



## *event* LogDerivativeAuthorRedemptionReservePartChanged

***TestRegistryUpgrade.LogDerivativeAuthorRedemptionReservePartChanged(_setter, _derivativeAuthorRedemptionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _derivativeAuthorRedemptionReservePart | uint32 | indexed |



## *event* LogNoDataCancellationPeriodChanged

***TestRegistryUpgrade.LogNoDataCancellationPeriodChanged(_setter, _noDataCancellationPeriod) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _noDataCancellationPeriod | uint256 | indexed |



## *event* LogProtocolExecutionReserveClaimerChanged

***TestRegistryUpgrade.LogProtocolExecutionReserveClaimerChanged(_setter, _protocolExecutionReserveClaimer) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolExecutionReserveClaimer | address | indexed |



## *event* LogProtocolExecutionReservePartChanged

***TestRegistryUpgrade.LogProtocolExecutionReservePartChanged(_setter, _protocolExecutionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolExecutionReservePart | uint32 | indexed |



## *event* LogProtocolPausableStateChanged

***TestRegistryUpgrade.LogProtocolPausableStateChanged(_setter, _state, _role) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _state | bool | indexed |
| _role | bytes32 | indexed |



## *event* LogProtocolRedemptionReserveClaimerChanged

***TestRegistryUpgrade.LogProtocolRedemptionReserveClaimerChanged(_setter, _protocolRedemptionReserveClaimer) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolRedemptionReserveClaimer | address | indexed |



## *event* LogProtocolRedemptionReservePartChanged

***TestRegistryUpgrade.LogProtocolRedemptionReservePartChanged(_setter, _protocolRedemptionReservePart) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _protocolRedemptionReservePart | uint32 | indexed |



## *event* LogWhitelistAccountAdded

***TestRegistryUpgrade.LogWhitelistAccountAdded(_setter, _whitelisted) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _whitelisted | address | indexed |



## *event* LogWhitelistAccountRemoved

***TestRegistryUpgrade.LogWhitelistAccountRemoved(_setter, _unlisted) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _setter | address | indexed |
| _unlisted | address | indexed |



## *event* RoleAdminChanged

***TestRegistryUpgrade.RoleAdminChanged(role, previousAdminRole, newAdminRole) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| previousAdminRole | bytes32 | indexed |
| newAdminRole | bytes32 | indexed |



## *event* RoleGranted

***TestRegistryUpgrade.RoleGranted(role, account, sender) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| account | address | indexed |
| sender | address | indexed |



## *event* RoleRevoked

***TestRegistryUpgrade.RoleRevoked(role, account, sender) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 | indexed |
| account | address | indexed |
| sender | address | indexed |



## *function* DEFAULT_ADMIN_ROLE

***TestRegistryUpgrade.DEFAULT_ADMIN_ROLE() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bytes32 |  |



## *function* addToWhitelist

***TestRegistryUpgrade.addToWhitelist(_whitelisted) ***

> Notice: It allows the WHITELISTER_ROLE to add an address to the whitelist

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _whitelisted | address |  |



## *function* getCore

***TestRegistryUpgrade.getCore() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address | `Opium.Core` |



## *function* getProtocolAddresses

***TestRegistryUpgrade.getProtocolAddresses() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple | RegistryEntities.ProtocolAddressesArgs struct that packs all the interfaces of the Opium Protocol |



## *function* getProtocolParameters

***TestRegistryUpgrade.getProtocolParameters() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | tuple | RegistryEntities.getProtocolParameters struct that packs the protocol lifecycle parameters {see RegistryEntities comments} |



## *function* getRoleAdmin

***TestRegistryUpgrade.getRoleAdmin(role) view***

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

***TestRegistryUpgrade.grantRole(role, account) ***

> Details: Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``'s admin role.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* hasRole

***TestRegistryUpgrade.hasRole(role, account) view***

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

***TestRegistryUpgrade.initialize(_governor) ***

> Notice: it is called only once upon deployment of the contract. It initializes the registry storage with the given governor address as the admin role.

> Details: Initializes the base RegistryStorage state

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _governor | address | address of the governance account which will be assigned all the roles included in the LibRoles library and the OpenZeppelin AccessControl.DEFAULT_ADMIN_ROLE |



## *function* isCoreConfigurationUpdater

***TestRegistryUpgrade.isCoreConfigurationUpdater(_address) view***

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

***TestRegistryUpgrade.isCoreSpenderWhitelisted(_address) view***

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

***TestRegistryUpgrade.isProtocolPaused() view***

> Notice: It returns true if the protocol is globally paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* isProtocolPositionCancellationPaused

***TestRegistryUpgrade.isProtocolPositionCancellationPaused() view***

> Notice: It returns whether Core.cancel() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionCancellation is paused |



## *function* isProtocolPositionCreationPaused

***TestRegistryUpgrade.isProtocolPositionCreationPaused() view***

> Notice: It returns whether Core.create() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionCreation is paused |



## *function* isProtocolPositionExecutionPaused

***TestRegistryUpgrade.isProtocolPositionExecutionPaused() view***

> Notice: It returns whether Core.execute() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionExecution is paused |



## *function* isProtocolPositionMintingPaused

***TestRegistryUpgrade.isProtocolPositionMintingPaused() view***

> Notice: It returns whether Core.mint() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionMinting is paused |



## *function* isProtocolPositionRedemptionPaused

***TestRegistryUpgrade.isProtocolPositionRedemptionPaused() view***

> Notice: It returns whether Core.redeem() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolPositionRedemption is paused |



## *function* isProtocolReserveClaimPaused

***TestRegistryUpgrade.isProtocolReserveClaimPaused() view***

> Notice: It returns whether Core.execute() is currently paused

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | true if protocol is globally paused or if protocolReserveClaim is paused |



## *function* isRegistryManager

***TestRegistryUpgrade.isRegistryManager(_address) view***

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

***TestRegistryUpgrade.pause() ***

> Notice: It allows the GUARDIAN role to pause the entire Opium Protocol

> Details: it fails if the entire protocol is already paused



## *function* pauseProtocolPositionCancellation

***TestRegistryUpgrade.pauseProtocolPositionCancellation() ***

> Notice: It allows the PARTIAL_CANCEL_PAUSE_ROLE role to pause the cancellation of positions

> Details: it fails if the cancellation of positions is paused



## *function* pauseProtocolPositionCreation

***TestRegistryUpgrade.pauseProtocolPositionCreation() ***

> Notice: It allows the PARTIAL_CREATE_PAUSE_ROLE role to pause the creation of positions

> Details: it fails if the creation of positions is paused



## *function* pauseProtocolPositionExecution

***TestRegistryUpgrade.pauseProtocolPositionExecution() ***

> Notice: It allows the PARTIAL_EXECUTE_PAUSE_ROLE role to pause the execution of positions

> Details: it fails if the execution of positions is paused



## *function* pauseProtocolPositionMinting

***TestRegistryUpgrade.pauseProtocolPositionMinting() ***

> Notice: It allows the PARTIAL_MINT_PAUSE_ROLE role to pause the minting of positions

> Details: it fails if the minting of positions is paused



## *function* pauseProtocolPositionRedemption

***TestRegistryUpgrade.pauseProtocolPositionRedemption() ***

> Notice: It allows the PARTIAL_REDEEM_PAUSE_ROLE role to pause the redemption of positions

> Details: it fails if the redemption of positions is paused



## *function* pauseProtocolReserveClaim

***TestRegistryUpgrade.pauseProtocolReserveClaim() ***

> Notice: It allows the PARTIAL_CLAIM_RESERVE_PAUSE_ROLE role to pause the reserves claims

> Details: it fails if the reserves claims are paused



## *function* placeholder

***TestRegistryUpgrade.placeholder() ***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* removeFromWhitelist

***TestRegistryUpgrade.removeFromWhitelist(_whitelisted) ***

> Notice: It allows the WHITELISTER_ROLE to remove an address from the whitelist

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _whitelisted | address |  |



## *function* renounceRole

***TestRegistryUpgrade.renounceRole(role, account) ***

> Details: Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function's purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* revokeRole

***TestRegistryUpgrade.revokeRole(role, account) ***

> Details: Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``'s admin role.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| role | bytes32 |  |
| account | address |  |



## *function* setDerivativeAuthorExecutionFeeCap

***TestRegistryUpgrade.setDerivativeAuthorExecutionFeeCap(_derivativeAuthorExecutionFeeCap) ***

> Notice: It allows the DERIVATIVE_AUTHOR_EXECUTION_FEE_CAP_SETTER_ROLE role to change max fee that derivative author can set

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeAuthorExecutionFeeCap | uint32 | must be less than 100% |



## *function* setDerivativeAuthorRedemptionReservePart

***TestRegistryUpgrade.setDerivativeAuthorRedemptionReservePart(_derivativeAuthorRedemptionReservePart) ***

> Notice: It allows the REDEMPTION_RESERVE_PART_SETTER_ROLE role to change the fixed part (percentage) that the derivative author receives for each redemption of market neutral positions

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeAuthorRedemptionReservePart | uint32 | must be less than 1% |



## *function* setNoDataCancellationPeriod

***TestRegistryUpgrade.setNoDataCancellationPeriod(_noDataCancellationPeriod) ***

> Notice: It allows the NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE role to change the noDataCancellationPeriod (the timeframe after which a derivative can be cancelled if the oracle has not provided any data)

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _noDataCancellationPeriod | uint32 |  |



## *function* setProtocolAddresses

***TestRegistryUpgrade.setProtocolAddresses(_opiumProxyFactory, _core, _oracleAggregator, _syntheticAggregator, _tokenSpender) ***

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

***TestRegistryUpgrade.setProtocolExecutionReserveClaimer(_protocolExecutionReserveClaimer) ***

> Notice: It allows the EXECUTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE role to change the address of the recipient of execution protocol reserves

> Details: It must be called as part of the protocol's deployment setup after the core addresses have been deployedit must be a non-null address

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolExecutionReserveClaimer | address | address that will replace the current `protocolExecutionReserveClaimer` |



## *function* setProtocolExecutionReservePart

***TestRegistryUpgrade.setProtocolExecutionReservePart(_protocolExecutionReservePart) ***

> Notice: It allows the EXECUTION_RESERVE_PART_SETTER_ROLE role to change part of derivative author reserves originated from derivative executions go to the protocol reserves

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolExecutionReservePart | uint32 | must be less than 100% |



## *function* setProtocolRedemptionReserveClaimer

***TestRegistryUpgrade.setProtocolRedemptionReserveClaimer(_protocolRedemptionReserveClaimer) ***

> Notice: It allows the REDEMPTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE role to change the address of the recipient of redemption protocol reserves

> Details: It must be called as part of the protocol's deployment setup after the core addresses have been deployedit must be a non-null address

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolRedemptionReserveClaimer | address | address that will replace the current `protocolAddressesArgs.protocolRedemptionReserveClaimer` |



## *function* setProtocolRedemptionReservePart

***TestRegistryUpgrade.setProtocolRedemptionReservePart(_protocolRedemptionReservePart) ***

> Notice: It allows the REDEMPTION_RESERVE_PART_SETTER_ROLE role to change part of derivative author reserves originated from redemption of market neutral positions go to the protocol reserves

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _protocolRedemptionReservePart | uint32 | must be less than 100% |



## *function* supportsInterface

***TestRegistryUpgrade.supportsInterface(interfaceId) view***

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

***TestRegistryUpgrade.unpause() ***

> Notice: It allows the PROTOCOL_UNPAUSER_ROLE to unpause the Opium Protocol


