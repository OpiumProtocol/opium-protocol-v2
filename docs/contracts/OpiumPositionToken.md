## OpiumPositionToken

#### Domain logic

It is an erc20-permit contract representing either a LONG or SHORT position associated with a given derivative. It serves the purpose of bookkeeping for a position type of a derivative as much as that of a tokenized asset that can be composed with other financial primitives.

#### Actors

Users and contracts are expected to be the holders of Opium position tokens. The OpiumPositionToken contract itself also interacts with other contracts within the Opium Protocol such as Core and, especially, the OpiumProxyFactory.

#### Data/Control flow

The stateful operations are expected to have a one way data and control flow where the OpiumPositionToken contract is always the receiver and it is controlled by the OpiumProxyFactory. The OpiumPositionToken can interact with other contracts if, for instance, the recipient of a “mint” operation triggered by the OpiumProxyFactory is itself a contract.

#### Restrictions

The accessibility of stateful functions of the OpiumPositionToken is restricted to the OpiumProxyFactory.
