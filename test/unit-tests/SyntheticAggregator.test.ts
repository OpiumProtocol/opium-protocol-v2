// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import { derivativeFactory, getDerivativeHash } from "../../utils/derivatives";
import setup from "../__fixtures__";
import { toBN } from "../../utils/bn";
// types and constants
import { TNamedSigners } from "../../types";

describe("SyntheticAggregator", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it("should successfully return getMargin", async () => {
    const { syntheticAggregator, optionCallMock } = await setup();

    const derivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);

    const margin = await syntheticAggregator.callStatic.getMargin(hash, derivative);

    expect(margin.buyerMargin).to.be.equal(0);
    expect(margin.sellerMargin).to.be.equal(derivative.margin);
  });

  it("should successfully return syntheticCache", async () => {
    const { syntheticAggregator, optionCallMock } = await setup();
    const { author } = namedSigners;

    const derivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });
    const hash = getDerivativeHash(derivative);

    const syntheticCache = await syntheticAggregator.callStatic.getSyntheticCache(hash, derivative);

    expect(syntheticCache.authorAddress).to.be.equal(author.address);
    expect(syntheticCache.buyerMargin).to.be.equal(0);
    expect(syntheticCache.sellerMargin).to.be.equal(derivative.margin);
    expect(syntheticCache.authorCommission).to.be.equal(25);
  });
});
