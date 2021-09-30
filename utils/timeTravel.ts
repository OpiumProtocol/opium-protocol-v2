import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber } from "ethers";
import hre from "hardhat";

const timeTravel = async (seconds: number): Promise<void> => {
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

export default timeTravel;
