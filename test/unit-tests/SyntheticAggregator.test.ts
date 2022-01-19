// utils
import { expect } from "../chai-setup";
import { derivativeFactory, getDerivativeHash } from "../../utils/derivatives";
import setup from "../__fixtures__";
import { toBN } from "../../utils/bn";

describe("SyntheticAggregator", () => {
  it("should successfully return getMargin", async () => {
    const {
      contracts: { syntheticAggregator, optionCallMock },
    } = await setup();

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
    const {
      contracts: { syntheticAggregator, optionCallMock },
      users: { author },
    } = await setup();

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

    it("should successfully return a synthetic's LONG and SHORT margins from the syntheticCache", async () => {
      const {
        contracts: { syntheticAggregator, optionCallMock },
      } = await setup();

      const derivative = derivativeFactory({
        margin: toBN("70"),
        endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
        params: [toBN("200")],
        syntheticId: optionCallMock.address,
      });
      const hash = getDerivativeHash(derivative);

      const syntheticMargin = await syntheticAggregator.callStatic.getMargin(hash, derivative);

      expect(syntheticMargin.buyerMargin).to.be.equal(0);
      expect(syntheticMargin.sellerMargin).to.be.equal(derivative.margin);
    });
});
