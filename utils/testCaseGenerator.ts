import { utils, BigNumber } from "ethers";
import { TDerivative, TDerivativeOrder } from "../types";
import { getEVMElapsedSeconds } from "./evm";
import { getDerivativeHash } from "./derivatives";

const generateRandomMarginOrStrike = (): BigNumber => {
  const margin = (Math.random() * 1000).toFixed(3) + 1;
  return utils.parseUnits(margin, 18);
};

const generateRandomAmount = (): BigNumber => {
  const margin = (Math.random() * 200).toFixed(3) + 1;
  return utils.parseUnits(margin, 18);
};

export const createRandomDerivativeExpiry = async (): Promise<number> => {
  const elapsedSeconds = await getEVMElapsedSeconds();
  return ~~(Date.now() / 1000) + +elapsedSeconds + 60 * 60 * 24 * Math.ceil(Math.random() * 40);
};

export const generateRandomDerivative = async (
  oracleIdAddress: string,
  tokenAddress: string,
  syntheticIdAAddress: string,
): Promise<TDerivative> => {
  return {
    margin: generateRandomMarginOrStrike(),
    endTime: await createRandomDerivativeExpiry(),
    params: [generateRandomMarginOrStrike()],
    oracleId: oracleIdAddress,
    token: tokenAddress,
    syntheticId: syntheticIdAAddress,
  };
};

export const generateRandomDerivativeSetup = async (
  oracleIdAddress: string,
  tokenAddress: string,
  syntheticIdAAddress: string,
): Promise<TDerivativeOrder> => {
  const derivative = await generateRandomDerivative(oracleIdAddress, tokenAddress, syntheticIdAAddress);
  return {
    derivative,
    amount: generateRandomAmount(),
    price: generateRandomMarginOrStrike(),
    hash: getDerivativeHash(derivative),
  };
};
