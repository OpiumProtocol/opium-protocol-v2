// theirs
import { ethers } from "hardhat";
// utils
import { expect } from "../chai-setup";
import setup from "../__fixtures__";
import { pickError } from "../../utils/misc";
// types and constants
import { TNamedSigners } from "../../types";
import { semanticErrors, SECONDS_2_WEEKS, governanceRoles, zeroAddress, SECONDS_3_WEEKS } from "../../utils/constants";
import { shouldBehaveLikeRegistry } from "../Registry.behavior";

describe("Registry", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it("should ensure the Registry roles are assigned as expected", async () => {
    const { registry } = await setup();
    const { deployer, governor, notAllowed } = await ethers.getNamedSigners();

    expect(await registry.hasRole(governanceRoles.defaultAdminRole, governor.address), "not admin").to.be.true;
    expect(
      await registry.hasRole(governanceRoles.protocolAddressesSetterRole, governor.address),
      "not protocolAddressesSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.executionReservePartSetterRole, governor.address),
      "not executionReservePartSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.redemptionReservePartSetterRole, governor.address),
      "not protocolAddressesSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.noDataCancellationPeriodSetterRole, governor.address),
      "not noDataCancellationPeriodSetterRole",
    ).to.be.true;
    expect(await registry.hasRole(governanceRoles.guardianRole, governor.address), "not protocolAddressesSetterRole").to
      .be.true;
    expect(await registry.hasRole(governanceRoles.guardianRole, governor.address), "not guardianRole").to.be.true;
    expect(await registry.hasRole(governanceRoles.whitelisterRole, governor.address), "not whitelisterRole").to.be.true;
    expect(
      await registry.hasRole(governanceRoles.redemptionReservePartSetterRole, governor.address),
      "not redemptionReservePartSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.executionFeeCapSetterRole, governor.address),
      "not executionFeeCapSetterRole",
    ).to.be.true;
    expect(await registry.hasRole(governanceRoles.registryManagerRole, governor.address), "not registryManagerRole").to
      .be.true;

    expect(await registry.hasRole(governanceRoles.defaultAdminRole, deployer.address), "wrong admin").to.be.false;
    expect(await registry.hasRole(governanceRoles.guardianRole, deployer.address), "wrong guardianRole").to.be.false;
    expect(
      await registry.hasRole(governanceRoles.executionReservePartSetterRole, notAllowed.address),
      "wrong executionReservePartSetterRole",
    ).to.be.false;
    expect(
      await registry.hasRole(governanceRoles.protocolAddressesSetterRole, notAllowed.address),
      "wrong protocolAddressesSetterRole",
    ).to.be.false;
  });

  it("should ensure the initial protocol parameters are as expected", async () => {
    const { registry } = await setup();

    const protocolParams = await registry.getProtocolParameters();

    expect(protocolParams.noDataCancellationPeriod, "wrong noDataCancellationPeriod").to.be.eq(SECONDS_2_WEEKS);
    expect(protocolParams.derivativeAuthorExecutionFeeCap, "wrong derivativeAuthorExecutionFeeCap").to.be.eq(1000);
    expect(
      protocolParams.derivativeAuthorRedemptionReservePart,
      "wrong derivativeAuthorRedemptionReservePart",
    ).to.be.eq(10);
    expect(protocolParams.protocolExecutionReservePart, "wrong protocolExecutionReservePart").to.be.eq(1000);
    expect(protocolParams.protocolRedemptionReservePart, "wrong protocolRedemptionReservePart").to.be.eq(1000);
  });

  it("should ensure that the Registry getters return the correct data", async () => {
    const { registry, core, oracleIdMock } = await setup();
    const { deployer, governor } = await ethers.getNamedSigners();

    expect(await registry.isRegistryManager(governor.address), "wrong registryManager").to.be.eq(true);
    expect(await registry.isRegistryManager(deployer.address), "wrong registryManager").to.be.eq(false);
    expect(await registry.getCore(), "wrong core address").to.be.eq(core.address);
    expect(await registry.isProtocolPaused(), "wrong paused").to.be.false;
    expect(await registry.isCoreSpenderWhitelisted(core.address), "wrong coreSpenderWhitelist").to.be.eq(true);
    expect(await registry.isCoreSpenderWhitelisted(oracleIdMock.address), "wrong coreSpenderWhitelist").to.be.eq(false);
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

  it("should revert if a null address is provided as a protocol address argument", async () => {
    const { registry, opiumProxyFactory, syntheticAggregator, core, tokenSpender } = await setup();
    const { governor } = await ethers.getNamedSigners();

    await expect(
      registry
        .connect(governor)
        .setProtocolAddresses(
          opiumProxyFactory.address,
          core.address,
          zeroAddress,
          syntheticAggregator.address,
          tokenSpender.address,
        ),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_REGISTRY_NULL_ADDRESS));

    await expect(
      registry
        .connect(governor)
        .setProtocolAddresses(
          opiumProxyFactory.address,
          core.address,
          zeroAddress,
          syntheticAggregator.address,
          tokenSpender.address,
        ),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_REGISTRY_NULL_ADDRESS));

    await expect(registry.connect(governor).setProtocolExecutionReserveClaimer(zeroAddress)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_NULL_ADDRESS),
    );

    await expect(registry.connect(governor).setProtocolRedemptionReserveClaimer(zeroAddress)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_NULL_ADDRESS),
    );
  });

  it("should ensure the internal ACL is applied correctly", async () => {
    const { registry, opiumProxyFactory, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
    const { notAllowed } = namedSigners;

    await expect(
      registry
        .connect(notAllowed)
        .setProtocolAddresses(
          opiumProxyFactory.address,
          core.address,
          oracleAggregator.address,
          syntheticAggregator.address,
          tokenSpender.address,
        ),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_REGISTRY_ONLY_PROTOCOL_ADDRESSES_SETTER_ROLE));

    await expect(registry.connect(notAllowed).addToWhitelist(notAllowed.address)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_WHITELISTER_ROLE),
    );

    await expect(registry.connect(notAllowed).removeFromWhitelist(notAllowed.address)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_WHITELISTER_ROLE),
    );

    await expect(registry.connect(notAllowed).setProtocolExecutionReservePart(4)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_EXECUTION_RESERVE_PART_SETTER_ROLE),
    );

    await expect(registry.connect(notAllowed).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN_ROLE),
    );
  });

  it(`should allow the authorized roles to change the protocol's parameters`, async () => {
    const { registry } = await setup();
    const { authorized, governor } = namedSigners;

    // test setderivativeAuthorExecutionFeeCap setter
    await registry.connect(governor).setDerivativeAuthorExecutionFeeCap(12);
    expect(
      (await registry.getProtocolParameters()).derivativeAuthorExecutionFeeCap,
      "wrong derivativeAuthorExecutionFeeCap",
    ).to.be.eq(12);

    // test setDerivativeAuthorRedemptionFee setter
    await registry.connect(governor).setDerivativeAuthorRedemptionReservePart(7);
    expect(
      (await registry.getProtocolParameters()).derivativeAuthorRedemptionReservePart,
      "wrong derivativeAuthorRedemptionReservePart",
    ).to.be.eq(7);

    // test setNoDataCancellationPeriod setter
    await registry.connect(governor).setNoDataCancellationPeriod(SECONDS_3_WEEKS);
    expect(
      (await registry.getProtocolParameters()).noDataCancellationPeriod,
      "wrong noDataCancellationPeriod",
    ).to.be.eq(SECONDS_3_WEEKS);

    // test setProtocolExecutionReservePart setter
    await registry.connect(governor).setProtocolExecutionReservePart(2);
    expect(
      (await registry.getProtocolParameters()).protocolExecutionReservePart,
      "wrong protocolExecutionReservePart",
    ).to.be.eq(2);

    // test `pause` and `unpause` setters
    expect(await registry.isProtocolPaused(), "wrong paused").to.be.false;
    await registry.connect(governor).pause();
    expect(await registry.isProtocolPaused(), "wrong paused").to.be.true;
    await expect(registry.connect(governor).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ALREADY_PAUSED),
    );
    await registry.connect(governor).unpause();
    expect(await registry.isProtocolPaused(), "wrong unpaused").to.be.false;

    // test `addToWhitelist` and `removeFromWhitelist` setters
    expect(await registry.isCoreSpenderWhitelisted(authorized.address)).to.be.false;
    await registry.connect(governor).addToWhitelist(authorized.address);
    expect(await registry.isCoreSpenderWhitelisted(authorized.address)).to.be.true;
    await registry.connect(governor).removeFromWhitelist(authorized.address);
    expect(await registry.isCoreSpenderWhitelisted(authorized.address)).to.be.false;

    // test setProtocolExecutionReservePart after granting `OPIUM_RESERVE_SETTER_ROLE` role to another account
    await expect(registry.connect(authorized).setProtocolExecutionReservePart(4)).to.revertedWith("R4");
    await registry.connect(governor).grantRole(governanceRoles.executionReservePartSetterRole, authorized.address);
    await registry.connect(authorized).setProtocolExecutionReservePart(7);
    expect(
      (await registry.getProtocolParameters()).protocolExecutionReservePart,
      "wrong protocolExecutionReservePart",
    ).to.be.eq(7);
  });
});
