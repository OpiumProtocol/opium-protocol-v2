# Opium protocol v2

Opium v2 is a permissionless financial smart escrow protocol that allows its users to create fully customizable financial products. Its primary use-case is the management of derivatives, which are represented as a pair of LONG and SHORT ERC20 Opium position tokens. As a financial engineer, you can easily create a derivative contract with Opium v2 and be rewarded a portion of the reserves accrued by the protocol for each successful settlement of your own financial products. As a seller and buyer, you can partake in (for example) PUT or CALL options on an underlying by holding a specific Opium position token, you can exchange them on an AMM, exercise them at expiry or redeem them for initial margin if you hold an equal amount of LONG and SHORT positions. The focus of the design is to be as lean as possible as to enable the greatest flexibility and interoperability with other financial primitives.

![Opium-protocol-v2-architecture](./docs/opium_v2_architecture.jpg "Opium-v2-architecture")

## Deployment Addresses

### Mainnet

#### Arbitrum
| Contract            | Proxy                                      | Implementation                             |
|---------------------|--------------------------------------------|--------------------------------------------|
| Registry            | [0x17b6ffe276e8A4a299a5a87a656aFc5b8FA3ee4a](https://arbiscan.io/address/0x17b6ffe276e8A4a299a5a87a656aFc5b8FA3ee4a) | [0x845a7872d1cDe2B3285dE9f66B1D2EC70307cC6b](https://arbiscan.io/address/0x845a7872d1cDe2B3285dE9f66B1D2EC70307cC6b) |
| Core                | [0x1497A23a2abC0DAFFb8e333183cfC181b24bB570](https://arbiscan.io/address/0x1497A23a2abC0DAFFb8e333183cfC181b24bB570) | [0x5854694204828385ED3d5B9d0FF912794D78cdaE](https://arbiscan.io/address/0x5854694204828385ED3d5B9d0FF912794D78cdaE) |
| TokenSpender        | [0x0A9A6CD7485Dd77c6cec28FB1bd64D5969B79132](https://arbiscan.io/address/0x0A9A6CD7485Dd77c6cec28FB1bd64D5969B79132) | [0x7C78bfaDb7F0EA6E84CC5196B6fAC48fb1cFA34E](https://arbiscan.io/address/0x7C78bfaDb7F0EA6E84CC5196B6fAC48fb1cFA34E) |
| OpiumProxyFactory   | [0x328bC74ccA6578349B262D21563d5581DAA43a16](https://arbiscan.io/address/0x328bC74ccA6578349B262D21563d5581DAA43a16) | [0x5a608F8dfD67504Eb1F07D0b32ACD8753160fCA3](https://arbiscan.io/address/0x5a608F8dfD67504Eb1F07D0b32ACD8753160fCA3) |
| OpiumPositionToken  | -                                          | [0x6384f8070fda183e2b8ce0d521c0a9e7606e30ea](https://arbiscan.io/address/0x6384f8070fda183e2b8ce0d521c0a9e7606e30ea) |
| OracleAggregator    | [0x85d9c3784B277Bc10e1504Aa8f647132ba17A674](https://arbiscan.io/address/0x85d9c3784B277Bc10e1504Aa8f647132ba17A674) | [0xC3e733eaCCD9c3bc54450aCe8074F589760Ae079](https://arbiscan.io/address/0xC3e733eaCCD9c3bc54450aCe8074F589760Ae079) |
| SyntheticAggregator | [0xE6AFB8b01CAF0214706116c7Dc3B978E6eb8ce7e](https://arbiscan.io/address/0xE6AFB8b01CAF0214706116c7Dc3B978E6eb8ce7e) | [0xbd0e3097F47cEcA12407bAc42cDD574cf3072F23](https://arbiscan.io/address/0xbd0e3097F47cEcA12407bAc42cDD574cf3072F23) |
| ProxyAdmin          | -                                          | [0x2ba5fee02489c4c7d550b82044742084a652f01a](https://arbiscan.io/address/0x2ba5fee02489c4c7d550b82044742084a652f01a) |
### Testnet

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
