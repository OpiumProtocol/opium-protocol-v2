import { utils, BigNumber } from "ethers";
import { zeroAddress } from "./constants";
import { fromBN, toBN } from "./bn";
import { ICreatedDerivativeOrder, TDerivative, TDerivativeOrder } from "../types";
import { getEVMElapsedSeconds } from "./evm";

export const derivativeFactory = (derivative: Partial<TDerivative>): TDerivative => {
  const def = {
    margin: toBN("0"),
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
  const result = margin.mul(amount);
  return result.div(utils.parseUnits("1", 18));
};

export const createValidDerivativeExpiry = async (days: number): Promise<number> => {
  return ~~(Date.now() / 1000) + (await getEVMElapsedSeconds()) + +60 * 60 * 24 * days;
};

//for losing parties and under margin options
export const computeTotalGrossPayout = (payout: BigNumber, amount: BigNumber): BigNumber => {
  const grossPayout = +fromBN(payout).toString() * +fromBN(amount).toString();
  return toBN(grossPayout.toString());
};

type TFees = {
  totalFee: BigNumber;
  authorFee: BigNumber;
  protocolFee: BigNumber;
};

export const computeFees = (
  payout: BigNumber,
  derivativeFeeCommissionPercentage: BigNumber,
  derivativeAuthorCommissionBase: number,
  protocolCommissionPercentage: number,
  protocolFeeCommissionBase: number,
): TFees => {
  const totalFee = payout.mul(derivativeFeeCommissionPercentage).div(derivativeAuthorCommissionBase);
  const protocolFee = totalFee.mul(protocolCommissionPercentage).div(protocolFeeCommissionBase);
  const authorFee = totalFee.sub(protocolFee);
  console.log(`totalFee: ${totalFee.toString()}`);
  console.log(`authorFee ${authorFee.toString()}`);
  console.log(`protocolFee: ${protocolFee.toString()}`);

  return {
    totalFee,
    authorFee,
    protocolFee,
  };
};

export const computeTotalNetPayout = (payout: BigNumber, amount: BigNumber, totalFee: BigNumber): BigNumber => {
  return computeDerivativeMargin(payout, amount).sub(totalFee);
};

export enum EPayout {
  BUYER = "BUYER",
  SELLER = "SELLER",
}

export const calculateTotalGrossPayout = (
  buyerMargin: BigNumber,
  sellerMargin: BigNumber,
  buyerPayoutRatio: BigNumber,
  sellerPayoutRatio: BigNumber,
  amount: BigNumber,
  payoutType: EPayout,
): BigNumber => {
  const holderPayoutRatio = payoutType === EPayout.BUYER ? buyerPayoutRatio : sellerPayoutRatio;
  const payout = buyerMargin
    .add(sellerMargin)
    .mul(holderPayoutRatio)
    .div(buyerPayoutRatio.add(sellerPayoutRatio))
    .mul(amount)
    .div(toBN("1"));
  return payout;
};

export const calculateTotalGrossProfit = (
  buyerMargin: BigNumber,
  sellerMargin: BigNumber,
  buyerPayoutRatio: BigNumber,
  sellerPayoutRatio: BigNumber,
  amount: BigNumber,
  payoutType: EPayout,
): BigNumber => {
  const holderMargin = payoutType === EPayout.BUYER ? buyerMargin : sellerMargin;
  const holderPayoutRatio = payoutType === EPayout.BUYER ? buyerPayoutRatio : sellerPayoutRatio;
  if (holderPayoutRatio.gt(holderMargin)) {
    const payout = buyerMargin.add(sellerMargin).mul(holderPayoutRatio).div(buyerPayoutRatio.add(sellerPayoutRatio));
    return payout.sub(holderMargin).mul(amount).div(toBN("1"));
  } else {
    return toBN("0");
  }
};

export const calculateTotalNetPayout = (
  buyerMargin: BigNumber,
  sellerMargin: BigNumber,
  buyerPayoutRatio: BigNumber,
  sellerPayoutRatio: BigNumber,
  amount: BigNumber,
  totalProtocolFee: BigNumber,
  payoutType: EPayout,
): BigNumber => {
  const holderMargin = payoutType === EPayout.BUYER ? buyerMargin : sellerMargin;
  const holderPayoutRatio = payoutType === EPayout.BUYER ? buyerPayoutRatio : sellerPayoutRatio;
  const grossPayout = calculateTotalGrossPayout(
    buyerMargin,
    sellerMargin,
    buyerPayoutRatio,
    sellerPayoutRatio,
    amount,
    payoutType,
  );
  if (holderPayoutRatio.gt(holderMargin)) {
    return grossPayout.sub(totalProtocolFee);
  } else {
    return grossPayout;
  }
};
