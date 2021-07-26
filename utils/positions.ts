import { utils } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

export const calculatePortfolioId = (tokenIds: number[], tokenRatio: number[]): string => {
  return utils.solidityKeccak256(["uint256[]", "uint256[]"], [tokenIds, tokenRatio]);
};

export const calculateLongTokenId = (derivativeHash: string): BigNumber => {
  return BigNumber.from(utils.solidityKeccak256(["bytes", "string"], [derivativeHash, "LONG"]));
};

export const calculateShortTokenId = (derivativeHash: string): BigNumber => {
  return BigNumber.from(utils.solidityKeccak256(["bytes", "string"], [derivativeHash, "SHORT"]));
};
