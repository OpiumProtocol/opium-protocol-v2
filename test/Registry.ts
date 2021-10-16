// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import setup from "../utils/setup";
// types
import { TNamedSigners } from "../types";
import { DEFAULT_ADMIN_ROLE, guardianRole, longExecutorRole, shortExecutorRole } from "../utils/addresses";
import { SECONDS_2_WEEKS } from "../utils/constants";

describe("Registry", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it("should ensure the initial roles are as expected", async () => {
    const { registry } = await setup();
    const {
      deployer,
      governor,
      guardian,
      longExecutorOne,
      longExecutorTwo,
      shortExecutorOne,
      shortExecutorTwo,
      notAllowed,
    } = await ethers.getNamedSigners();

    expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, governor.address), "not governor").to.be.true;
    expect(await registry.hasRole(guardianRole, guardian.address), "not guardian").to.be.true;
    expect(await registry.hasRole(longExecutorRole, longExecutorOne.address), "not long executor").to.be.true;
    expect(await registry.hasRole(longExecutorRole, longExecutorTwo.address), "not long executor").to.be.true;
    expect(await registry.hasRole(shortExecutorRole, shortExecutorOne.address), "not short executor").to.be.true;
    expect(await registry.hasRole(shortExecutorRole, shortExecutorTwo.address), "not short executor").to.be.true;
    expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), "wrong governor").to.be.false;
    expect(await registry.hasRole(guardianRole, deployer.address), "wrong GUARDIAN").to.be.false;
    expect(await registry.hasRole(longExecutorRole, notAllowed.address), "wrong long executor").to.be.false;
    expect(await registry.hasRole(longExecutorRole, notAllowed.address), "wrong short executor").to.be.false;
  });

  it("should ensure the initial protocol parameters are as expected", async () => {
    const { registry } = await setup();

    const protocolParams = await registry.getProtocolCommissionParams();
    expect(protocolParams.derivativeAuthorCommissionBase, "wrong derivative author commission base").to.be.eq(10000);
    expect(protocolParams.protocolFeeCommissionBase, "wrong protocol commission base").to.be.eq(10);
    expect(protocolParams.protocolCommissionPart, "wrong protocol commission part").to.be.eq(1);
    expect(protocolParams.noDataCancellationPeriod, "wrong noDataCancellationPeriod").to.be.eq(SECONDS_2_WEEKS);
    expect(await registry.isPaused(), "it's paused").to.be.false;
  });

  it("should ensure the protocol addresses are as expected", async () => {
    const { registry, opiumProxyFactory, oracleAggregator, syntheticAggregator, core, tokenSpender } = await setup();

    const protocolAddresses = await registry.getProtocolAddresses();
    expect(protocolAddresses.opiumProxyFactory).to.be.eq(opiumProxyFactory.address);
    expect(protocolAddresses.syntheticAggregator).to.be.eq(syntheticAggregator.address);
    expect(protocolAddresses.oracleAggregator).to.be.eq(oracleAggregator.address);
    expect(protocolAddresses.core).to.be.equal(core.address);
    expect(protocolAddresses.tokenSpender).to.be.equal(tokenSpender.address);
  });

  it("should ensure the internal ACL is applied correctly", async () => {
    const { registry, opiumProxyFactory, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
    const { notAllowed, longExecutorOne } = namedSigners;

    try {
      await registry
        .connect(longExecutorOne)
        .registerProtocol(
          opiumProxyFactory.address,
          core.address,
          oracleAggregator.address,
          syntheticAggregator.address,
          tokenSpender.address,
          notAllowed.address,
        );
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("NOT_GOVERNOR");
    }

    try {
      await registry.connect(notAllowed).addToWhitelist(notAllowed.address);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("NOT_LONG_EXECUTOR");
    }

    try {
      await registry.connect(notAllowed).removeFromWhitelist(notAllowed.address);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("NOT_LONG_EXECUTOR");
    }

    try {
      await registry.connect(notAllowed).setOpiumCommissionPart(4);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("NOT_LONG_EXECUTOR");
    }

    try {
      await registry.connect(longExecutorOne).pause();
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("NOT_GUARDIAN");
    }
  });

  it(`should allow the authorized roles to change the protocol's parameters`, async () => {
    const { registry } = await setup();
    const { authorized, longExecutorOne, longExecutorTwo } = namedSigners;

    expect(await registry.isWhitelisted(authorized.address)).to.be.false;
    await registry.connect(longExecutorOne).addToWhitelist(authorized.address);
    expect(await registry.isWhitelisted(authorized.address)).to.be.true;

    await registry.connect(longExecutorTwo).removeFromWhitelist(authorized.address);

    expect(await registry.isWhitelisted(authorized.address)).to.be.false;

    await registry.connect(longExecutorTwo).setOpiumCommissionPart(4);

    const commissionParams = await registry.getProtocolCommissionParams();
    expect(commissionParams.protocolCommissionPart).to.be.eq(4);
  });

  it("should allow the guardian to toggle the paused state variable", async () => {
    const { registry } = await setup();
    const { guardian } = namedSigners;
    expect(await registry.isPaused(), "it's paused").to.be.false;
    await registry.connect(guardian).pause();
    expect(await registry.isPaused(), "it's paused").to.be.true;

    try {
      // should throw a failure if "paused" is set to true
      await registry.connect(guardian).pause();
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("already paused");
    }

    await registry.connect(guardian).unpause();
    expect(await registry.isPaused(), "it's unpaused").to.be.false;
  });
});
