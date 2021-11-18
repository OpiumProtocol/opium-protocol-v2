// theirs
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
// utils
import setup from "../../utils/setup";
import { derivativeFactory, getDerivativeHash } from "../../utils/derivatives";
import { toBN } from "../../utils/bn";
// types and constants
import { TNamedSigners } from "../../types";
import {
  TestOracleAggregatorUpgrade,
  TestRegistryUpgrade,
  TestSyntheticAggregatorUpgrade,
  TestTokenSpenderUpgrade,
  TestCoreUpgrade,
} from "../../typechain";
import { shouldBehaveLikeCore } from "../Core.behavior";
import { generateRandomDerivativeSetup } from "../../utils/testCaseGenerator";

describe("Upgradeability", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it("should upgrade TokenSpender", async () => {
    const { registry, tokenSpender } = await setup();

    const tokenSpenderRegistryAddressBefore = (await registry.getProtocolAddresses()).tokenSpender;
    const tokenSpenderImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(
      tokenSpender.address,
    );
    const TestTokenSpenderUpgrade = await ethers.getContractFactory("TestTokenSpenderUpgrade");
    const upgraded = <TestTokenSpenderUpgrade>(
      await upgrades.upgradeProxy(tokenSpender.address, TestTokenSpenderUpgrade)
    );
    const tokenSpenderImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(
      tokenSpender.address,
    );
    const upgradeImplementationAddress = await upgrades.erc1967.getImplementationAddress(tokenSpender.address);
    const tokenSpenderRegistryAddresAfter = (await registry.getProtocolAddresses()).tokenSpender;

    expect(upgraded.address).to.be.eq(tokenSpender.address);
    expect(tokenSpenderImplementationAddressBefore).to.not.be.eq(tokenSpenderImplementationAddressAfter);
    expect(tokenSpenderImplementationAddressAfter).to.be.eq(upgradeImplementationAddress);
    expect(tokenSpenderRegistryAddressBefore).to.be.eq(tokenSpenderRegistryAddresAfter);
  });

  it("should upgrade Registry", async () => {
    const { registry } = await setup();

    const [protocolAddressesBefore, protocolCommissionsBefore] = await Promise.all([
      registry.getProtocolAddresses(),
      registry.getProtocolParameters(),
    ]);
    const registryImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(registry.address);

    const Registry = await ethers.getContractFactory("TestRegistryUpgrade");
    const upgraded = <TestRegistryUpgrade>await upgrades.upgradeProxy(registry.address, Registry);
    const registryImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(registry.address);
    const upgradedImplementationAddress = await upgrades.erc1967.getImplementationAddress(upgraded.address);

    expect(upgraded.address).to.be.eq(registry.address);
    expect(registryImplementationAddressBefore).to.not.be.eq(registryImplementationAddressAfter);
    expect(registryImplementationAddressAfter).to.be.eq(upgradedImplementationAddress);

    expect(protocolAddressesBefore).to.be.deep.eq(await upgraded.getProtocolAddresses());
    expect(protocolCommissionsBefore).to.be.deep.eq(await upgraded.getProtocolParameters());
  });

  it("should upgrade SyntheticAggregator", async () => {
    const { syntheticAggregator, optionCallMock, registry } = await setup();

    const { syntheticAggregator: syntheticAggregatorAddress } = await registry.getProtocolAddresses();
    const syntheticAggregatorImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(
      syntheticAggregator.address,
    );

    const SyntheticAggregatorUpgrade = await ethers.getContractFactory("TestSyntheticAggregatorUpgrade");
    const upgraded = <TestSyntheticAggregatorUpgrade>(
      await upgrades.upgradeProxy(syntheticAggregator.address, SyntheticAggregatorUpgrade)
    );
    const syntheticAggregatorImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(
      syntheticAggregator.address,
    );
    const upgradedImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(upgraded.address);

    const { syntheticAggregator: syntheticAggregatorAddressAfter } = await registry.getProtocolAddresses();

    expect(upgraded.address).to.be.eq(syntheticAggregator.address);
    expect(syntheticAggregatorImplementationAddressBefore).to.not.be.eq(syntheticAggregatorImplementationAddressAfter);
    expect(syntheticAggregatorAddress).to.be.eq(syntheticAggregatorAddressAfter);
    expect(syntheticAggregatorImplementationAddressAfter).to.be.eq(upgradedImplementationAddressAfter);

    const derivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);

    const margin = await upgraded.callStatic.getMargin(hash, derivative);

    expect(margin.buyerMargin).to.be.equal(0);
    expect(margin.sellerMargin).to.be.equal(derivative.margin);
  });

  it("should upgrade OracleAggregator", async () => {
    const { oracleAggregator, registry } = await setup();
    const { oracle } = namedSigners;

    const oracleAggregatorAddressBefore = (await registry.getProtocolAddresses()).oracleAggregator;
    const oracleAggregatorImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(
      oracleAggregator.address,
    );

    const OracleAggregatorUpgrade = await ethers.getContractFactory("TestOracleAggregatorUpgrade");
    const upgraded = <TestOracleAggregatorUpgrade>(
      await upgrades.upgradeProxy(oracleAggregator.address, OracleAggregatorUpgrade)
    );
    const oracleAggregatorImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(
      oracleAggregator.address,
    );
    const upgradedImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(upgraded.address);
    const oracleAggregatorAddressAfter = (await registry.getProtocolAddresses()).oracleAggregator;

    expect(upgraded.address).to.be.eq(oracleAggregator.address);
    expect(oracleAggregatorImplementationAddressBefore).to.not.be.eq(oracleAggregatorImplementationAddressAfter);
    expect(oracleAggregatorAddressBefore).to.be.eq(oracleAggregatorAddressAfter);
    expect(oracleAggregatorImplementationAddressAfter).to.be.eq(upgradedImplementationAddressAfter);

    /**
     * repeats the OracleAggregator `should accept data from oracle` test with the upgraded core contract
     * TODO:
     * remove code duplication and set up test suites to keep it DRY
     */
    const timestamp = Math.floor(Date.now() / 1000);
    const data = 123456789;
    await upgraded.connect(oracle).__callback(timestamp, data);
    const result = await upgraded.getData(oracle.address, timestamp);

    expect(result).to.be.equal(data);
  });

  it("should upgrade Core", async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry, oracleIdMock } = await setup();
    const { buyer, seller, governor } = namedSigners;

    const coreAddressBefore = await registry.getCore();
    const coreImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(core.address);

    const CoreUpgraded = await ethers.getContractFactory("TestCoreUpgrade");
    const upgraded = <TestCoreUpgrade>await upgrades.upgradeProxy(core.address, CoreUpgraded);
    const coreImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(core.address);
    const upgradedImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(upgraded.address);

    const coreAddressAfter = await registry.getCore();

    expect(upgraded.address).to.be.eq(core.address);
    expect(coreImplementationAddressBefore).to.not.be.eq(coreImplementationAddressAfter);
    expect(coreAddressBefore).to.be.eq(coreAddressAfter);
    expect(coreImplementationAddressAfter).to.be.eq(upgradedImplementationAddressAfter);

    await upgraded.connect(governor).updateProtocolAddresses();
    await upgraded.connect(governor).updateProtocolParametersArgs();

    const derivativeOrder = await generateRandomDerivativeSetup(
      oracleIdMock.address,
      testToken.address,
      optionCallMock.address,
    );

    const oracleCallback = async () => {
      await oracleIdMock.triggerCallback(derivativeOrder.derivative.endTime, derivativeOrder.price);
    };

    await shouldBehaveLikeCore(
      upgraded,
      registry,
      testToken,
      tokenSpender,
      opiumProxyFactory,
      optionCallMock,
      oracleCallback,
      seller,
      buyer,
      derivativeOrder,
    );
  });
});
