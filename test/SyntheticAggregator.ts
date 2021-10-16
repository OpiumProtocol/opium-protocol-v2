// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import { derivativeFactory, getDerivativeHash } from "../utils/derivatives";
import setup from "../utils/setup";
import { toBN } from "../utils/bn";
// types and constants
import { TNamedSigners } from "../types";

describe("SyntheticAggregator", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it("should successfully return getMargin", async () => {
    const { syntheticAggregator, optionCallMock } = await setup();

    const derivative = derivativeFactory({
      margin: toBN('30'),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [toBN('200')],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);

    const margin = await syntheticAggregator.callStatic.getMargin(hash, derivative);

    expect(margin.buyerMargin).to.be.equal(0);
    expect(margin.sellerMargin).to.be.equal(derivative.margin);
  });

  it("should successfully return authorAddress", async () => {
    const { syntheticAggregator, optionCallMock } = await setup();
    const { deployer } = namedSigners;

    const derivative = derivativeFactory({
      margin: toBN('30'),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [toBN('200')],
      syntheticId: optionCallMock.address,
    });
    const hash = getDerivativeHash(derivative);

    const authorAddress = await syntheticAggregator.callStatic.getAuthorAddress(hash, derivative);

    expect(authorAddress).to.be.equal(deployer.address);
  });

  it("should successfully return authorCommission", async () => {
    const { syntheticAggregator, optionCallMock } = await setup();

    const derivative = derivativeFactory({
      margin: toBN('30'),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [toBN('200')],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);
    const commission = await syntheticAggregator.callStatic.getAuthorCommission(hash, derivative);

    expect(commission).to.be.equal(25);
  });
});
