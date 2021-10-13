import { utils, BigNumber } from "ethers";
import { AUTHOR_COMMISSION, OPIUM_COMMISSION, zeroAddress } from "./constants";
import { cast } from "./bn";
import { ICreatedDerivativeOrder, TDerivative, TDerivativeOrder } from "../types";

export const derivativeFactory = (derivative: Partial<TDerivative>): TDerivative => {
  const def = {
    margin: cast(0),
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

export const calculateFees = (payout: BigNumber) => {
  const opiumOverallFee = Math.floor(payout.toNumber() * AUTHOR_COMMISSION);

  const opiumFee = Math.floor(opiumOverallFee * OPIUM_COMMISSION);
  const authorFee = opiumOverallFee - opiumFee;

  return {
    opiumOverallFee,
    authorFee,
    opiumFee,
  };
};

export const calculatePayoutFee = (payout: BigNumber): BigNumber => {
  const { opiumOverallFee } = calculateFees(payout);
  return BigNumber.from(opiumOverallFee);
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

export const computeDerivativeMargin = (margin: BigNumber, amount: number): BigNumber => {
  return margin.mul(amount);
};

export const createValidExpiry = (days: number): number => {
  return ~~(Date.now() / 1000) + 60 * 60 * 24 * days;
};
