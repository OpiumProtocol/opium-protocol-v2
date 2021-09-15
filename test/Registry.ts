import { ethers } from "hardhat";
import { expect } from "chai";
import setup from "../utils/setup";
import { TNamedSigners } from "../hardhat.config";

describe("Registry", () => {
  let namedSigners: TNamedSigners

  before(async() => {
    namedSigners = await ethers.getNamedSigners() as TNamedSigners;
  })

  it("should revert for non initializer address", async () => {
    try {
      const { registry, opiumProxyFactory, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
      const { deployer, notAllowed } = namedSigners

      await registry
        .connect(notAllowed)
        .init(
          opiumProxyFactory.address,
          core.address,
          oracleAggregator.address,
          syntheticAggregator.address,
          tokenSpender.address,
          deployer.address,
        );
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("Ownable: caller is not the owner");
    }
  });

  it("should revert on a second init call", async () => {
    try {
      const { registry, opiumProxyFactory, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
      const {deployer} = namedSigners;

      await registry.init(
        opiumProxyFactory.address,
        core.address,
        oracleAggregator.address,
        syntheticAggregator.address,
        tokenSpender.address,
        deployer.address,
      );
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("REGISTRY:ALREADY_SET");
    }
  });

  it("should correctly get core address", async () => {
    const { registry, core } = await setup();

    const result = await registry.getCore();
    expect(result).to.be.equal(core.address);
  });

  it("should correctly get opium proxy factory address", async () => {
    const { registry, opiumProxyFactory } = await setup();

    const result = await registry.getOpiumProxyFactory();
    expect(result).to.be.equal(opiumProxyFactory.address);
  });

  it("should correctly get oracle aggregator address", async () => {
    const { registry, oracleAggregator } = await setup();

    const result = await registry.getOracleAggregator();
    expect(result).to.be.equal(oracleAggregator.address);
  });

  it("should correctly get synthetic aggregator address", async () => {
    const { registry, syntheticAggregator } = await setup();

    const result = await registry.getSyntheticAggregator();
    expect(result).to.be.equal(syntheticAggregator.address);
  });
});
