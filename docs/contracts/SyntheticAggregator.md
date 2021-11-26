## SyntheticAggregator

#### Domain logic

It allows users and consumer contracts to query information about a specific derivative. It is not, however, just a data provider but it also performs one stateful security-critical operation: the caching of a non-cached derivative. This is fundamental as it prevents malicious actors from manipulating the internal data model of a derivative during its own financial lifecycle.

#### Actors

Both users and third-party contracts are expected to interact with the SyntheticAggregator as consumers. The only Opium Protocol’s contract that directly consumes the SyntheticAggregator data is the Core contract.
The SyntheticAggregator is itself a consumer of a SyntheticId, a derivative contract compliant with the IDerivative interface.

#### Data/control flow

The SyntheticAggregator is expected to be a direct consumer of only SyntheticId contracts. All the other relations with other contracts expect the SyntheticAggregator to be the data provider from which a consumer contract pulls the data related to a SyntheticId.

#### Restrictions

The most critical restriction is that the SyntheticAggregator should cache the SyntheticId data only once during a derivative’s lifecycle to avoid malicious manipulations.
It is also expected to only retrieve information from contracts that comply with the IDerivative interface specification.
