## Registry

#### Domain logic

It is a parameter and address discovery module with its own granular access-control logic and setters that allow the authorized actors to change critical protocol-wide parameters.

#### Actors

The rationale of the access-control logic is to have a role per each setter and an admin role to be delegated to a DAO (not part of the core protocol itself).

#### Data/control flow

It is the ‘source of truth’ of the protocol as all other protocol’s contracts are in a pull-based consumer relation with it - with the partial exception of the module RegistryManager which provides to the core contracts a function to allow an authorized party whose role is managed in the current Registry to point to a new Registry

#### Restrictions

The main business logic restrictions are the restrictions set by its own access-control logic: with the exception of the admin, no role should be authorized to call more than a single. \
See ["ACL"](https://github.com/OpiumProtocol/opium-protocol-v2/blob/feature/development/docs/acl.specs.md) section in the documentation.
