import { utils, BigNumber } from "ethers";
import { zeroAddress } from "./constants";
import { fromBN, toBN } from "./bn";
import { ICreatedDerivativeOrder, TDerivative, TDerivativeOrder } from "../types";
import { getEVMElapsedSeconds } from "./timeTravel";

export const derivativeFactory = (derivative: Partial<TDerivative>): TDerivative => {
  const def = {
    margin: toBN('0'),
    endTime: 0,
    params: [],
    oracleId: zeroAddress,
    token: zeroAddress,
    syntheticId: zeroAddress,
  };

  return {
    ...def,
    ...derivative,
  };
};

export const getDerivativeHash = (derivative: TDerivative): string => {
  return utils.solidityKeccak256(
    ["uint256", "uint256", "uint256[]", "address", "address", "address"],
    [
      derivative.margin,
      derivative.endTime,
      derivative.params,
      derivative.oracleId,
      derivative.token,
      derivative.syntheticId,
    ],
  );
};

export const addPositionTokens = (
  derivativeOrder: TDerivativeOrder,
  shortPositionAddress: string,
  longPositionAddress: string,
): ICreatedDerivativeOrder => {
  return {
    ...derivativeOrder,
    shortPositionAddress,
    longPositionAddress,
  };
};

export const computeDerivativeMargin = (margin: BigNumber, amount: BigNumber): BigNumber => {
  return margin.mul(amount);
};

export const createValidDerivativeExpiry = async(days: number): Promise<number> => {
  return ~~(Date.now() / 1000) + await getEVMElapsedSeconds() + + 60 * 60 * 24 * days;
};

type TFees = {
  authorFee: BigNumber;
  protocolFee: BigNumber;
  totalFee: BigNumber;
  totalAuthorFee: BigNumber;
  totalProtocolFee: BigNumber;
};

export const computeFees = (
  payout: BigNumber,
  amount: BigNumber,
  derivativeFeeCommissionPercentage: BigNumber,
  derivativeAuthorCommissionBase: number,
  protocolCommissionPercentage: number,
  protocolFeeCommissionBase: number,
): TFees => {
  const authorFee = +fromBN(payout) * (+derivativeFeeCommissionPercentage.toString() / derivativeAuthorCommissionBase);
  const protocolFee = (authorFee * protocolCommissionPercentage) / protocolFeeCommissionBase;

  const authorFeeToBN = toBN(authorFee.toString());
  const protocolFeeToBN = toBN(protocolFee.toString());
  const totalFee = authorFee * +fromBN(amount).toString();
  const totalProtocolFee = protocolFee * +fromBN(amount).toString();
  const totalAuthorFee = totalFee - totalProtocolFee;

  console.log("authorFee ", authorFee);
  console.log("protocolFee ", protocolFee);
  console.log("totalProtocolFee ", totalProtocolFee);
  console.log("totalAuthorFee ", totalAuthorFee);

  return {
    authorFee: authorFeeToBN,
    protocolFee: protocolFeeToBN,
    totalFee: toBN(totalFee.toString()),
    totalAuthorFee: toBN(totalAuthorFee.toString()),
    totalProtocolFee: toBN(totalProtocolFee.toString()),
  };
};

//for losing parties and under margin options
export const computeTotalGrossPayout = (payout: BigNumber, amount: BigNumber): BigNumber => {
  const grossPayout = +fromBN(payout).toString() * +fromBN(amount).toString();
  return toBN(grossPayout.toString());
};

export const computeTotalNetPayout = (payout: BigNumber, amount: BigNumber, totalFee: BigNumber): BigNumber => {
  const netPayout = +fromBN(computeTotalGrossPayout(payout, amount)).toString() - +fromBN(totalFee).toString();
  return toBN(netPayout.toString());
};
