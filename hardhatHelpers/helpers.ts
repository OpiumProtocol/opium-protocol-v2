import { HardhatNetworkUserConfig } from "hardhat/types/config";
import { NetworkUserConfig } from "hardhat/types";
import config from "./config";

const { infuraApiKey, mnemonic, hardhatNetworkEnvironment, chainIds, privateKey } = config;

export const createInfuraUrl = (network: keyof typeof chainIds): string => {
  return "https://" + network + ".infura.io/v3/" + infuraApiKey;
};

export const createHardhatNetworkConfig = (): HardhatNetworkUserConfig => {
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

export const createTestnetConfig = (network: keyof typeof chainIds, nodeUrl: string): NetworkUserConfig => {
  return {
    accounts: {
      count: 30,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url: nodeUrl,
  };
};

export const createTestnetWithL2Config = (network: keyof typeof chainIds, nodeUrl: string): NetworkUserConfig => {
  return {
    ...createTestnetConfig(network, nodeUrl),
    companionNetworks: {
      l2: "https://rinkeby.arbitrum.io/rpc",
    },
  };
};

export const createNetworkConfigWithPrivateKey = (
  network: keyof typeof chainIds,
  nodeUrl: string,
  withPrivateKey: boolean = false,
  customGasPrice?: number
): NetworkUserConfig => {
  if (withPrivateKey) {
    if (!privateKey) {
      throw new Error(`please set PRIVATE_KEY in a .env file`);
    }

    return {
      accounts: privateKey.split(" "),
      chainId: chainIds[network],
      url: nodeUrl,
      gasPrice: customGasPrice,
    };
  }
  return {
    accounts: {
      count: 20,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url: nodeUrl,
    gasPrice: customGasPrice,
  };
};
