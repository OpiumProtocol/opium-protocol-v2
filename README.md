# Opium protocol v2

Opium v2 is a permissionless financial smart escrow protocol that allows its users to create fully customizable financial products. Its primary use-case is the management of derivatives, which are represented as a pair of LONG and SHORT ERC20 Opium position tokens. As a financial engineer, you can easily create a derivative contract with Opium v2 and be rewarded a portion of the reserves accrued by the protocol for each successful settlement of your own financial products. As a seller and buyer, you can partake in (for example) PUT or CALL options on an underlying by holding a specific Opium position token, you can exchange them on an AMM, exercise them at expiry or redeem them for initial margin if you hold an equal amount of LONG and SHORT positions. The focus of the design is to be as lean as possible as to enable the greatest flexibility and interoperability with other financial primitives.

![Opium-protocol-v2-architecture](./docs/opium_v2_architecture.jpg "Opium-v2-architecture")

## Local Development Setup and initialization

#### Clone repo and install dependencies

The setup assumes that you have:

- Node.js ^14.5
- Yarn

Clone the project and install all dependencies:

```sh
$ git clone git@github.com:OpiumProtocol/opium-protocol-v2.git
$ cd opium-protocol-v2

# install project dependencies
$ yarn install
```

#### Set environment variables

You need to set the environment variable values. Unless you want to deploy the project on a network, the only important value here is the mnemonic as it is used to deterministically generate the accounts used for the tests. Set the following variables on the `.env` file on the root level of the repository:

```sh
touch .env
```

```sh
ETHERSCAN_KEY: "abc"
BSCSCAN_API_KEY: "abc"
BSC_MAINNET_ENDPOINT: "abc"
POLYGON_MAINNET_ENDPOINT: "abc"
INFURA_API_KEY: "abc"
MNEMONIC: "test test test test test test test test test test test junk"
HARDHAT_NETWORK_ENVIRONMENT='local'
```

Note that to run the tests that require a mainnnet fork, it is required to change the HARDHAT_NETWORK_ENVIRONMENT variable as follows:
```sh
HARDHAT_NETWORK_ENVIRONMENT='fork'
```

#### Deployment on a local hardhat network and initialization

```sh
yarn deploy
```

The above command runs the deployment fixtures in `deploy/index.ts`. \
The steps performed are the following:

- Deploys contracts defined in the Protocol fixtures (deploy/index.ts)
- After successful deployment, all the Protocol addresses (OpiumProxyFactory, Core, OracleAggregator, SyntheticAggregator, TokenSpender) and the protocol’s reserves receivers (named protocolExecutionReserveClaimer and protocolRedemptonReserveClaimer) should be stored in the Registry contract
- After successful registration, the core contract should be added to the whitelist of TokenSpenders

## Compile all contracts:

```sh
yarn compile
```

## Run all the tests:

```sh
yarn test
```

## Contract docs

See the [core contracts documentation here](https://github.com/OpiumProtocol/opium-protocol-v2/tree/main/docs/contracts)
