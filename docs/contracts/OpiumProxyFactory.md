## OpiumProxyFactory

#### Domain logic

It is the only entry point to perform stateful operations on derivative positions - as derivative positions are represented as erc20 tokens, these operations include minting and burning and the deployment itself of a new erc20 contract.

#### Actors

All the stateful logic of the OpiumProxyFactory is expected to involve only Core - as the controller of the OpiumProxyFactory - and the Opium position tokens - as an entity which is manipulated by the OpiumProxyFactory.

#### Data/control flow

The stateful operations are expected to have a one way data and control flow whereby the Core contract calls the OpiumProxyFactory with the financial parameters of a derivative and subsequently the OpiumProxyFactory ‘translates’ the financial parameters into an erc20 api compatible language - i.e: the creation of a new derivative with 4 LONG and SHORT positions is translated into the deployment of two erc20 contracts with an equivalent supply each.

#### Restrictions

All the stateful functions should only be accessible to the Core contract
