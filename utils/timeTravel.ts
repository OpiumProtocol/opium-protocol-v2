import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber } from "ethers";
import hre from "hardhat";

export const timeTravel = async (seconds: number): Promise<void> => {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
  await hre.network.provider.send("evm_mine");
};

export const impersonateContract = async (impersonator: string, bytecode: string): Promise<void> => {
  await hre.network.provider.send("hardhat_setCode", [impersonator, bytecode]);
};

export const impersonateAccount = async (mockedAccount: string): Promise<SignerWithAddress> => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [mockedAccount],
  });
  const signer = await hre.ethers.getSigner(mockedAccount);
  return signer;
};

export const setBalance = async (account: string, balance: BigNumber): Promise<void> => {
  await hre.network.provider.send("hardhat_setBalance", [account, hre.ethers.utils.hexlify(balance)]);
};

export const resetNetwork = async (): Promise<void> => {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
};

export const takeEVMSnapshot = async (): Promise<any> => {
  // TODO: check and skip if it is unsupported testnet
  const snapshot = await hre.network.provider.request({
    method: " evm_snapshot",
    params: [],
  });
  return snapshot
};

export const getEVMElapsedSeconds = async (): Promise<number> => {
  const time = await hre.network.provider.send("evm_increaseTime", [0]);
  await hre.network.provider.send("evm_mine");
  return time;
};
