import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber } from "ethers";

export type TNamedSigners = {
  deployer: SignerWithAddress;
  governor: SignerWithAddress;
  longExecutorOne: SignerWithAddress;
  shortExecutorOne: SignerWithAddress;
  longExecutorTwo: SignerWithAddress;
  shortExecutorTwo: SignerWithAddress;
  guardian: SignerWithAddress;
  buyer: SignerWithAddress;
  seller: SignerWithAddress;
  oracle: SignerWithAddress;
  author: SignerWithAddress;
  thirdParty: SignerWithAddress;
  notAllowed: SignerWithAddress;
  hacker: SignerWithAddress;
  goodGuy: SignerWithAddress;
  authorized: SignerWithAddress;
  impersonator: SignerWithAddress;
  createPositionPauser: SignerWithAddress;
  coreCancelPositionPauser: SignerWithAddress;
  redemptionReserveClaimer: SignerWithAddress;
};

export type TDerivative = {
  margin: BigNumber;
  endTime: number;
  params: BigNumber[];
  oracleId: string;
  token: string;
  syntheticId: string;
};

export type TDerivativeOrder = {
  derivative: TDerivative;
  amount: BigNumber;
  price: BigNumber;
  hash: string;
};

export enum ENodeServices {
  INFURA = "INFURA",
  ALCHEMY = "ALCHEMY",
  RPC = "RPC",
}

export interface ICreatedDerivativeOrder extends TDerivativeOrder {
  shortPositionAddress: string;
  longPositionAddress: string;
}
