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
  longPositionAddress: string,
  shortPositionAddress: string,
): ICreatedDerivativeOrder => {
  return {
    ...derivativeOrder,
    longPositionAddress,
    shortPositionAddress,
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

// //@ts-ignore
// export const parseDerivativeStructValues = (struct: {[key: any]: any}): TDerivative => {
//     const properties = ['margin', 'endTime', 'params', 'oracleId', 'token','syntheticId']

//   const derivative = properties.reduce((acc, key) => {
//     // if(key === 'params') {
//     //   //@ts-ignore
//     //   const params = struct[key].map(param => param.toString());
//     //   //@ts-ignore
//     //   acc[key] = params
//     //   return acc
//     // }
//        if (key === "endTime") {
//          //@ts-ignore
        
//          //@ts-ignore
//          acc[key] = +struct[key].toString();
//          return acc;
//        }
//     //@ts-ignore
//     acc[key] = struct[key]
//     //@ts-ignore
//     console.log('isbignum: ', BigNumber.isBigNumber(struct[key]));
//     return acc
//   }, {})
//   return derivative as TDerivative
// }

        // const parsed = parseDerivativeStructValues(shortTokenData.derivative);
        // console.log("parsed: ", parsed);

        // console.log("secondDerivative", secondDerivative);
        // console.log("shortTokenData.derivative", typeof shortTokenData.derivative);
        // expect(parsed, "short deep").to.be.deep.eq(secondDerivative);