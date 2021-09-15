import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-deploy";
import'@openzeppelin/hardhat-upgrades';
// import "hardhat-deploy-ethers";
import "hardhat-dependency-compiler";
import "hardhat-gas-reporter";
import "solidity-coverage";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

import { resolve } from "path";

import "./tasks/accounts";
import "./tasks/clean";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
if (!ETHERSCAN_KEY) {
  throw new Error("Please set your ETHERSCAN_KEY in a .env file");
}
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
if (!BSCSCAN_API_KEY) {
  throw new Error("Please set your BSCSCAN_API_KEY in a .env file");
}
const bscTestnetEndpoint = process.env.BSC_TESTNET_ENDPOINT || "https://data-seed-prebsc-1-s2.binance.org:8545/";
const bscMainnetEndpoint = process.env.BSC_MAINNET_ENDPOINT;
if (!bscMainnetEndpoint) {
  throw new Error("Please set your BSC_MAINNET_ENDPOINT in a .env file");
}
const polygonMumbaiEndpoint = process.env.POLYGON_MUMBAI_ENDPOINT || "https://rpc-mumbai.matic.today";
const polygonMainnetEndpoint = process.env.POLYGON_MAINNET_ENDPOINT;
if (!polygonMainnetEndpoint) {
  throw new Error("Please set your POLYGON_MAINNET_ENDPOINT in a .env file");
}

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  polygonMumbai: 80001,
  polygonMainnet: 137,
  bscTestnet: 97,
  bscMainnet: 56,
};

const mnemonic =
  process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

const createInfuraUrl = (network: keyof typeof chainIds): string => {
  return "https://" + network + ".infura.io/v3/" + infuraApiKey;
};

const createTestnetConfig = (network: keyof typeof chainIds, nodeUrl: string): NetworkUserConfig => {
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url: nodeUrl,
  };
};

export type TNamedSigners = {
  deployer: SignerWithAddress
  governor: SignerWithAddress
  buyer: SignerWithAddress
  seller: SignerWithAddress
  oracle: SignerWithAddress
  author: SignerWithAddress
  thirdParty: SignerWithAddress
  notAllowed: SignerWithAddress
  hacker: SignerWithAddress
  goodGuy: SignerWithAddress
  authorized: SignerWithAddress
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: true,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    goerli: createTestnetConfig("goerli", createInfuraUrl("goerli")),
    kovan: createTestnetConfig("kovan", createInfuraUrl("kovan")),
    rinkeby: createTestnetConfig("rinkeby", createInfuraUrl("rinkeby")),
    ropsten: createTestnetConfig("ropsten", createInfuraUrl("ropsten")),
    bscTestnet: createTestnetConfig("bscTestnet", bscTestnetEndpoint),
    bscMainnet: createTestnetConfig("bscMainnet", bscMainnetEndpoint),
    polygonMumbai: createTestnetConfig("polygonMumbai", polygonMumbaiEndpoint),
    polygonMainnet: createTestnetConfig("polygonMainnet", polygonMainnetEndpoint),
    ganache: createTestnetConfig("ganache", "http://localhost:8545"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.5",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    governor: {
      default: 1,
    },
    buyer: {
      default: 2,
    },
    seller: {
      default: 3,
    },
    oracle: {
      default: 4,
    },
    author: {
      default: 5,
    },
    thirdParty: {
      default: 6,
    },
    notAllowed: {
      default: 7,
    },
    hacker: {
      default: 8,
    },
    goodGuy: {
      default: 9
    },
    authorized: {
      default: 10
    }
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};

export default config;
