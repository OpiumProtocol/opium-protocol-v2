import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "../.env") });

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
  arbitrum: 42161,
  arbitrumTestnet: 421611,
};

// ENV: Config
const CONTRACT_SIZER_STRICT = process.env.CONTRACT_SIZER_STRICT !== "0";

// ************ ENV: Secrets ************
const bscTestnetEndpoint = process.env.BSC_TESTNET_ENDPOINT || "https://data-seed-prebsc-1-s2.binance.org:8545/";
const polygonMumbaiEndpoint = process.env.POLYGON_MUMBAI_ENDPOINT || "https://matic-mumbai.chainstacklabs.com";

// ENV: it can either be `fork` or `local`
// set to `fork` to run the hardhat tests using an ethereum mainnet fork
const hardhatNetworkEnvironment = process.env.HARDHAT_NETWORK_ENVIRONMENT;
if (!hardhatNetworkEnvironment) {
  throw new Error("Please set your HARDHAT_NETWORK_ENVIRONMENT in a .env file");
}

// bsc mainnet rpc url
const bscMainnetEndpoint = process.env.BSC_MAINNET_ENDPOINT;
if (!bscMainnetEndpoint) {
  throw new Error("Please set your BSC_MAINNET_ENDPOINT in a .env file");
}

// polygon mainnet rpc url
const polygonMainnetEndpoint = process.env.POLYGON_MAINNET_ENDPOINT;
if (!polygonMainnetEndpoint) {
  throw new Error("Please set your POLYGON_MAINNET_ENDPOINT in a .env file");
}

// mnemonic
const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

// infura api key
const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

// etherscan key
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
if (!ETHERSCAN_KEY) {
  throw new Error("Please set your ETHERSCAN_KEY in a .env file");
}

// bscscan key
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
if (!BSCSCAN_API_KEY) {
  throw new Error("Please set your BSCSCAN_API_KEY in a .env file");
}

// arbiscan key
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;
if (!ARBISCAN_API_KEY) {
  throw new Error("Please set your ARBISCAN_API_KEY in a .env file");
}

// optional private key
const privateKey = process.env.PRIVATE_KEY;

const config = {
  hardhatNetworkEnvironment,
  bscTestnetEndpoint,
  bscMainnetEndpoint,
  polygonMumbaiEndpoint,
  polygonMainnetEndpoint,
  mnemonic,
  infuraApiKey,
  chainIds,
  privateKey,
  etherscanKey: ETHERSCAN_KEY,
  bscscanKey: BSCSCAN_API_KEY,
  arbiscanKey: ARBISCAN_API_KEY,
  contractSizerStrict: CONTRACT_SIZER_STRICT,
};

export default config;
