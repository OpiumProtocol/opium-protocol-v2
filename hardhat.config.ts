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
import { HardhatUserConfig } from "hardhat/config";
import {
  createHardhatNetworkConfig,
  createTestnetConfig,
  createInfuraUrl,
  createTestnetWithL2Config,
  createNetworkConfigWithPrivateKey,
} from "./hardhatHelpers/helpers";
import envConfig from "./hardhatHelpers/config";
import "./tasks/clean";

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
    arbitrum: createNetworkConfigWithPrivateKey("arbitrum", "https://arb1.arbitrum.io/rpc", true),
    arbitrumTestnet: createTestnetConfig("arbitrumTestnet", "https://rinkeby.arbitrum.io/rpc"),
    rinkeby: createTestnetWithL2Config("rinkeby", createInfuraUrl("rinkeby")),
    goerli: createNetworkConfigWithPrivateKey("goerli", createInfuraUrl("goerli"), true),
    kovan: createTestnetConfig("kovan", createInfuraUrl("kovan")),
    ropsten: createTestnetConfig("ropsten", createInfuraUrl("ropsten")),
    bscTestnet: createTestnetConfig("bscTestnet", envConfig.bscTestnetEndpoint),
    bscMainnet: createTestnetConfig("bscMainnet", envConfig.bscMainnetEndpoint),
    polygonMumbai: createTestnetConfig("polygonMumbai", envConfig.polygonMumbaiEndpoint),
    polygonMainnet: createTestnetConfig("polygonMainnet", envConfig.polygonMainnetEndpoint),
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
    authorized: {
      default: 12,
    },
    impersonator: {
      default: 13,
    },
    thirdParty: {
      default: 14,
    },
    createPositionPauser: {
      default: 15,
    },
    coreCancelPositionPauser: {
      default: 16,
    },
    redemptionReserveClaimer: {
      default: 0,
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: {
      rinkeby: envConfig.etherscanKey,
      goerli: envConfig.etherscanKey,
      arbitrumTestnet: envConfig.arbiscanKey,
    },
  },
  mocha: {
    timeout: 40000,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: envConfig.contractSizerStrict,
  },
  docgen: {
    path: "./docs/contracts/specs",
    clear: true,
    runOnCompile: false,
  },
};

export default config;
