// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import setup from "../__fixtures__";
// types
import { TNamedSigners } from "../../types";
import { pickError } from "../../utils/misc";
import {
  semanticErrors,
  SECONDS_2_WEEKS,
  DEFAULT_ADMIN_ROLE,
  protocolRegisterRole,
  guardianRole,
  parameterSetterRole,
} from "../../utils/constants";

describe("Registry", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it("should ensure the initial roles are as expected", async () => {
    const { registry } = await setup();
    const { deployer, governor, notAllowed } = await ethers.getNamedSigners();

    expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, governor.address), "not admin").to.be.true;
    expect(await registry.hasRole(guardianRole, governor.address), "not guardianRole").to.be.true;
    expect(await registry.hasRole(parameterSetterRole, governor.address), "not parameterSetterRole").to.be.true;
    expect(await registry.hasRole(protocolRegisterRole, governor.address), "not protocolRegisterRole").to.be.true;
    expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), "wrong admin").to.be.false;
    expect(await registry.hasRole(guardianRole, deployer.address), "wrong guardianRole").to.be.false;
    expect(await registry.hasRole(parameterSetterRole, notAllowed.address), "wrong parameterSetterRole").to.be.false;
    expect(await registry.hasRole(protocolRegisterRole, notAllowed.address), "wrong protocolRegisterRole").to.be.false;
  });

  it("should ensure the initial protocol parameters are as expected", async () => {
    const { registry } = await setup();

    const protocolParams = await registry.getProtocolParameters();

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
    const { notAllowed } = namedSigners;

    await expect(
      registry
        .connect(notAllowed)
        .registerProtocol(
          opiumProxyFactory.address,
          core.address,
          oracleAggregator.address,
          syntheticAggregator.address,
          tokenSpender.address,
          notAllowed.address,
          notAllowed.address,
        ),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_REGISTRY_ONLY_PROTOCOL_REGISTER_ROLE));

    await expect(registry.connect(notAllowed).addToWhitelist(notAllowed.address)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_WHITELISTER_ROLE),
    );

    await expect(registry.connect(notAllowed).removeFromWhitelist(notAllowed.address)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_WHITELISTER_ROLE),
    );

    await expect(registry.connect(notAllowed).setOpiumCommissionPart(4)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARAMETER_SETTER_ROLE),
    );

    await expect(registry.connect(notAllowed).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN),
    );
  });

  it(`should allow the authorized roles to change the protocol's parameters`, async () => {
    const { registry } = await setup();
    const { authorized, governor } = namedSigners;

    expect(await registry.isCoreSpenderWhitelisted(authorized.address)).to.be.false;
    await registry.connect(governor).addToWhitelist(authorized.address);
    expect(await registry.isCoreSpenderWhitelisted(authorized.address)).to.be.true;

    await registry.connect(governor).removeFromWhitelist(authorized.address);

    expect(await registry.isCoreSpenderWhitelisted(authorized.address)).to.be.false;

    await registry.connect(governor).setOpiumCommissionPart(4);

    const commissionParams = await registry.getProtocolParameters();
    expect(commissionParams.protocolCommissionPart).to.be.eq(4);
  });

  it("should allow the guardian to toggle the paused state variable", async () => {
    const { registry } = await setup();
    const { governor } = namedSigners;
    expect(await registry.isPaused(), "it's paused").to.be.false;
    await registry.connect(governor).pause();
    expect(await registry.isPaused(), "it's paused").to.be.true;

    // should throw a failure if "paused" is set to true
    await expect(registry.connect(governor).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ALREADY_PAUSED),
    );

    await registry.connect(governor).unpause();
    expect(await registry.isPaused(), "it's unpaused").to.be.false;
  });
});
