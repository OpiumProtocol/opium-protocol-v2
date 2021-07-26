import { ethers } from "hardhat";
import { derivativeFactory, getDerivativeHash } from "../utils/derivatives";
import { expect } from "chai";
import setup from "../utils/setup";
import { TNamedSigners } from "../hardhat.config";

describe("SyntheticAggregator", () => {
  let namedSigners: TNamedSigners

  before(async() => {
    namedSigners = await ethers.getNamedSigners() as TNamedSigners;
  })
  it(`should successfully return isPool`, async () => {
    const { syntheticAggregator, optionCallMock } = await setup();

    const derivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [200],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);
    const isPool = await syntheticAggregator.callStatic.isPool(hash, derivative);

    expect(isPool).to.be.not.true;
  });

  it("should successfully return getMargin", async () => {
    const { syntheticAggregator, optionCallMock } = await setup();

    const derivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [200],
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
      margin: 30,
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [200],
      syntheticId: optionCallMock.address,
    });
    const hash = getDerivativeHash(derivative);

    const authorAddress = await syntheticAggregator.callStatic.getAuthorAddress(hash, derivative);

    expect(authorAddress).to.be.equal(deployer.address);
  });

  it("should successfully return authorCommission", async () => {
    const { syntheticAggregator, optionCallMock } = await setup();

    const derivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [200],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);
    const commission = await syntheticAggregator.callStatic.getAuthorCommission(hash, derivative);

    expect(commission).to.be.equal(25);
  });
});
