## Core

#### Domain logic

It is the main user-facing entry-point to the Opium Protocol. It acts as the sole controller of all the financial and business logic operations of the protocol. It also acts as an escrow for the funds allocated for all the financial products built on top of Opium.
The user-facing business logic operations include:

- Creation of a new derivative
- Minting of new positions of an existing derivative
- Execution of a derivative position
- Redemption of market-neutral positions
- Cancellation of a derivative position (if execution is not possible)
- Claim reserves (for derivative authors)

#### Actors

Users and contracts are expected to interact with the Core contract. Within the Opium Protocol, the Core contract is also the only contract that interacts with all the other core contracts.

#### Data/control flow

It is expected to receive data and stateful actions from anyone - users and contracts. Within the Opium protocol, it also both pulls data from specific data sources (Registry, SyntheticAggregator, OracleAggregator, OpiumPositionToken) and pushes/performs stateful actions on other contracts (OpiumProxyFactory).

#### Restrictions

The main restriction that relies on a third-party is the ‘pausability’ of its user-facing functions: the Core contract operations can be restricted partially or completely by the governance if they activate one of the emergency mechanism options provided by the Registry contract. The other restrictions are related to the business requirements that Core needs to satisfy: as a user-facing contract performing financial operations in a permissionless environment, all the external functions perform checks to ensure the compliance of the user-provided data with its own logic and data models. Some of these checks include ensuring that a derivative cannot be exercised before expiry (time-based validation), preventing a third-party from manipulating the data of a derivative contract after its creation (caching validation) and ensuring that only the authorized actors can withdraw and/or exercise their rightful assets (access-control validation)
