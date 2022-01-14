import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-dependency-compiler";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "hardhat-docgen";
import "@hardhat-docgen/core";
import "@hardhat-docgen/markdown";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { HardhatNetworkUserConfig } from "hardhat/types/config";
import { NetworkUserConfig } from "hardhat/types";

import { resolve } from "path";

import "./tasks/clean";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// ENV: Config
const CONTRACT_SIZER_STRICT = process.env.CONTRACT_SIZER_STRICT !== "0";

// ENV: Secrets
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
const polygonMumbaiEndpoint = process.env.POLYGON_MUMBAI_ENDPOINT || "https://matic-mumbai.chainstacklabs.com";
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

const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

// it can either be `fork` or `local`
const hardhatNetworkEnvironment = process.env.HARDHAT_NETWORK_ENVIRONMENT;
if (!hardhatNetworkEnvironment) {
  throw new Error("Please set your HARDHAT_NETWORK_ENVIRONMENT in a .env file");
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

const createHardhatNetworkConfig = (): HardhatNetworkUserConfig => {
  if (hardhatNetworkEnvironment === "fork") {
    return {
      allowUnlimitedContractSize: false,
      accounts: {
        mnemonic,
      },
      forking: {
        url: createInfuraUrl("mainnet"),
      },
      chainId: chainIds.mainnet,
    };
  }
  return {
    allowUnlimitedContractSize: false,
    accounts: {
      mnemonic,
    },
    chainId: chainIds.hardhat,
  };
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: true,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: createHardhatNetworkConfig(),
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
    longExecutorOne: {
      default: 2,
    },
    shortExecutorOne: {
      default: 3,
    },
    longExecutorTwo: {
      default: 4,
    },
    shortExecutorTwo: {
      default: 5,
    },
    guardian: {
      default: 6,
    },
    buyer: {
      default: 7,
    },
    seller: {
      default: 8,
    },
    oracle: {
      default: 9,
    },
    author: {
      default: 10,
    },
    notAllowed: {
      default: 11,
    },
    hacker: {
      default: 12,
    },
    goodGuy: {
      default: 13,
    },
    authorized: {
      default: 14,
    },
    impersonator: {
      default: 15,
    },
    thirdParty: {
      default: 16,
    },
    createPositionPauser: {
      default: 17,
    },
    coreCancelPositionPauser: {
      default: 18,
    },
    redemptionReserveClaimer: {
      default: 19,
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  mocha: {
    timeout: 40000,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: CONTRACT_SIZER_STRICT,
  },
  docgen: {
    path: "./docs/contracts/specs",
    clear: true,
    runOnCompile: false,
  },
};

export default config;
