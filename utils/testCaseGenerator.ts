import { utils, BigNumber } from "ethers";
import moment from "moment";
import { TDerivative, TDerivativeOrder } from "../types";
import { getEVMElapsedSeconds } from "./evm";
import { getDerivativeHash } from "./derivatives";

export const generateExpectedOpiumPositionTokenName = (
  timestamp: number,
  derivativeAuthorCustomName: string,
  derivativeHash: string,
  isLong: boolean,
): string => {
  const formattedTime = moment(timestamp * 1000)
    .format("YYYY-MM-DD h:mm:ss")
    .slice(0, 10)
    .split("-")
    .join("");
  return "Opium:"
    .concat(formattedTime)
    .concat(`-${derivativeAuthorCustomName}-`)
    .concat(derivativeHash.slice(0, 2).concat(derivativeHash.slice(2, 6).toUpperCase()))
    .concat(isLong ? "-LONG" : "-SHORT");
};

export const generateExpectedOpiumPositionTokenSymbol = (
  timestamp: number,
  derivativeAuthorCustomName: string,
  derivativeHash: string,
  isLong: boolean,
): string => {
  const formattedTime = moment(timestamp * 1000)
    .format("YYYY-MM-DD h:mm:ss")
    .slice(0, 10)
    .split("-")
    .join("");
  return "OPIUM_"
    .concat(formattedTime)
    .concat(`_${derivativeAuthorCustomName}_`)
    .concat(derivativeHash.slice(0, 2).concat(derivativeHash.slice(2, 6).toUpperCase()))
    .concat(isLong ? "_L" : "_S");
};

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
  return ~~(Date.now() / 1000) + +elapsedSeconds + 60 * 60 * 24 * Math.ceil(Math.random() * 1000);
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
