import { zeroAddress } from "./addresses";
import { BigNumber, utils } from "ethers";
import { cast } from "./bn";

export type TDerivative = {
  margin: BigNumber;
  endTime: number;
  params: number[];
  oracleId: string;
  token: string;
  syntheticId: string;
};

export type TDerivativeOrder = {
  derivative: TDerivative;
  amount: number;
  price: BigNumber;
  hash: string;
};

export interface ICreatedDerivativeOrder extends TDerivativeOrder {
  shortPositionAddress: string;
  longPositionAddress: string;
}

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
