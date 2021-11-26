## OracleAggregator

#### Domain logic

It is the data layer of the Opium Protocol. Its main responsibility is to store the required data to perform the settlement of a given derivative after its maturity. It does not, however, perform any business logic validation in itself as it is designed to be as flexible and lean as possible.

#### Actors

Both users and third-party contracts are expected to interact with the OracleAggregator as consumers both to pull and push data. Within the Opium Protocol contract that directly consumes the OracleAggregator data is the Core contract as it is the contract responsible to perform financial operations.
Data flow
It is only a recipient of data provided by other accounts. All the contracts that require data from the Oracle Aggregator need to pull it using the OracleAggregator.getData which is assumed to be the only entry-point. The only contract that pulls data from the OracleAggregator within the Opium protocol is the Core contract.

#### Restrictions

The only restriction that is enforced on the OracleAggregator level is to not allow the same data to be pushed more than once on the same ‘data entry’, whereby a data entry is defined by `[address][timestamp]`. As such, it is the responsibility of a consumer contract to perform any kind of business logic validation - such as, in the case of Core, fetching the data provided by the correct OracleId and not fetching any data provided before the maturity of a derivative.
