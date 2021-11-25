# Opium protocol v2

Opium v2 is a permissionless financial smart escrow protocol that allows its users to create fully customizable financial products. Its primary use-case is the management of derivatives, which are represented as a pair of LONG and SHORT ERC20 Opium position tokens. As a financial engineer, you can easily create a derivative contract with Opium v2 and be rewarded a portion of the reserves accrued by the protocol for each successful settlement of your own financial products. As a seller and buyer, you can partake in (for example) PUT or CALL options on an underlying by holding a specific Opium position token, you can exchange them on an AMM, exercise them at expiry or redeem them for initial margin if you hold an equal amount of LONG and SHORT positions. The focus of the design is to be as lean as possible as to enable the greatest flexibility and interoperability with other financial primitives.

## Local Development Setup

The setup assumes that you have:

- Node.js ^14.5
- Yarn

Clone the project and install all dependencies:

```sh
$ git clone git@github.com:OpiumProtocol/opium-protocol-v2.git
$ cd opium-protocol-v2

# install project dependencies
$ yarn install

# set environment variables
touch .env
```

You need to set the environment variable values. Unless you want to deploy the project on a network, the only important value here is the mnemonic as it is used to deterministically generate the accounts used for the tests. Set the following variables on the `.env` file:

```sh
ETHERSCAN_KEY: "abc"
BSCSCAN_API_KEY: "abc"
BSC_MAINNET_ENDPOINT: "abc"
POLYGON_MAINNET_ENDPOINT: "abc"
INFURA_API_KEY: "abc"
MNEMONIC: "test test test test test test test test test test test junk"
```

Compile all contracts:

```sh
yarn compile
```

Run all the tests:

```sh
yarn test
```
