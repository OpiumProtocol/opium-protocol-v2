import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export const toBN = (value: string): BigNumber => {
  return ethers.utils.parseEther(value);
};

export const fromBN = (value: BigNumber): string => {
  return ethers.utils.formatEther(value);
};

export const cast = (x: number | BigNumber | string): BigNumber => {
  return BigNumber.from(x);
};

export const eq = (x: number, y: number): boolean => {
  return cast(x).eq(cast(y));
};

export const mul = (x: number | BigNumber, y: number | BigNumber): BigNumber => {
  return cast(x).mul(cast(y));
};

export const pow = (x: number, y: number): BigNumber => {
  return cast(x).pow(cast(y));
};

export const frac = (x: BigNumber, n: string, d: string): BigNumber => {
  return x.mul(toBN(n)).div(toBN(d));
};

export const mulWithPrecisionFactor = (x: BigNumber, y: BigNumber): BigNumber => {
  return x.mul(y).div(toBN("1"));
};
