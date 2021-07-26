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
      const { registry, tokenMinter, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
      const { deployer, notAllowed } = namedSigners

      await registry
        .connect(notAllowed)
        .init(
          tokenMinter.address,
          core.address,
          oracleAggregator.address,
          syntheticAggregator.address,
          tokenSpender.address,
          deployer.address,
        );
    } catch (error) {
      expect(error.message).to.include("REGISTRY:ONLY_INITIALIZER");
    }
  });

  it("should revert on a second init call", async () => {
    try {
      const { registry, tokenMinter, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
      const {deployer} = namedSigners;

      await registry.init(
        tokenMinter.address,
        core.address,
        oracleAggregator.address,
        syntheticAggregator.address,
        tokenSpender.address,
        deployer.address,
      );
    } catch (error) {
      expect(error.message).to.include("REGISTRY:ALREADY_SET");
    }
  });

  it("should correctly get core address", async () => {
    const { registry, core } = await setup();

    const result = await registry.getCore();
    expect(result).to.be.equal(core.address);
  });

  it("should correctly get token minter address", async () => {
    const { registry, tokenMinter } = await setup();

    const result = await registry.getMinter();
    expect(result).to.be.equal(tokenMinter.address);
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
