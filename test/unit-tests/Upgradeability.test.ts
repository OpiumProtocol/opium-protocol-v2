// theirs
import hre from "hardhat";
// utils
import { expect } from "../chai-setup";
// import setup from "../../utils/setup";
import setup from "../__fixtures__";
import { derivativeFactory, getDerivativeHash } from "../../utils/derivatives";
import { toBN } from "../../utils/bn";
import {
  TestRegistryUpgrade,
  TestSyntheticAggregatorUpgrade,
  TestTokenSpenderUpgrade,
  TestCoreUpgrade,
} from "../../typechain";
import { EPositionCreation, shouldBehaveLikeCore } from "../Core.behavior";
import { generateRandomDerivativeSetup } from "../../utils/testCaseGenerator";
import { TestOracleAggregatorUpgrade } from "../../typechain/TestOracleAggregatorUpgrade";

describe("Upgradeability", () => {
  it("should upgrade TokenSpender", async () => {
    const {
      contracts: { registry, tokenSpender },
      users: { deployer },
    } = await setup();
    const { deployments, ethers } = hre;
    const { deploy } = deployments;

    const tokenSpenderRegistryAddressBefore = (await registry.getProtocolAddresses()).tokenSpender;
    const tokenSpenderImplementationAddressBefore = (
      await deployments.getDeploymentsFromAddress(tokenSpenderRegistryAddressBefore)
    )[1].implementation;

    const deployed = await deploy("TokenSpender", {
      contract: "TestTokenSpenderUpgrade",
      from: deployer.address,
      log: true,
      proxy: {
        owner: deployer.address,
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [registry.address],
          },
        },
      },
    });
    const tokenSpenderImplementationAddressAfter = deployed.implementation;
    const upgraded = <TestTokenSpenderUpgrade>await ethers.getContractAt("TestTokenSpenderUpgrade", deployed.address);

    const tokenSpenderRegistryAddresAfter = (await registry.getProtocolAddresses()).tokenSpender;
    expect(
      upgraded.address,
      "new implementation's proxy address is different from the previous implementation's proxy address",
    ).to.be.eq(tokenSpender.address);
    expect(
      tokenSpenderImplementationAddressBefore,
      "new implementation's address is not different from the previous implementation's address",
    ).to.not.be.eq(tokenSpenderImplementationAddressAfter);
    expect(tokenSpenderRegistryAddressBefore).to.be.eq(tokenSpenderRegistryAddresAfter);
    expect(await upgraded.placeholder()).to.be.eq("upgraded");
  });

  it("should upgrade Registry", async () => {
    const {
      contracts: { registry },
      users: { deployer, governor },
    } = await setup();
    const { deployments, ethers } = hre;
    const { deploy } = deployments;

    const [protocolAddressesBefore, protocolCommissionsBefore] = await Promise.all([
      registry.getProtocolAddresses(),
      registry.getProtocolParameters(),
    ]);
    const registryImplementationAddressBefore = (await deployments.getDeploymentsFromAddress(registry.address))[1]
      .implementation;

    const deployed = await deploy("Registry", {
      contract: "TestRegistryUpgrade",
      from: deployer.address,
      log: true,
      proxy: {
        owner: deployer.address,
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [governor.address],
          },
        },
      },
    });

    const upgraded = <TestRegistryUpgrade>await ethers.getContractAt("TestRegistryUpgrade", deployed.address);
    const registryImplementationAddressAfter = (await deployments.getDeploymentsFromAddress(registry.address))[1]
      .implementation;
    const upgradedImplementationAddress = deployed.implementation;

    expect(upgraded.address).to.be.eq(registry.address);
    expect(registryImplementationAddressBefore).to.not.be.eq(registryImplementationAddressAfter);
    expect(registryImplementationAddressAfter).to.be.eq(upgradedImplementationAddress);

    expect(protocolAddressesBefore).to.be.deep.eq(await upgraded.getProtocolAddresses());
    expect(protocolCommissionsBefore).to.be.deep.eq(await upgraded.getProtocolParameters());
    expect(await upgraded.placeholder()).to.be.eq("upgraded");
  });

  it("should upgrade SyntheticAggregator", async () => {
    const {
      contracts: { syntheticAggregator, optionCallMock, registry },
      users: { deployer, governor },
    } = await setup();
    const { deployments, ethers } = hre;
    const { deploy } = deployments;
    const { syntheticAggregator: syntheticAggregatorAddressBefore } = await registry.getProtocolAddresses();

    const syntheticAggregatorImplementationAddressBefore = (
      await deployments.getDeploymentsFromAddress(syntheticAggregator.address)
    )[1].implementation;

    const deployed = await deploy("SyntheticAggregator", {
      contract: "TestSyntheticAggregatorUpgrade",
      from: deployer.address,
      log: true,
      proxy: {
        owner: deployer.address,
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [governor.address],
          },
        },
      },
    });

    const upgraded = <TestSyntheticAggregatorUpgrade>(
      await ethers.getContractAt("TestSyntheticAggregatorUpgrade", deployed.address)
    );
    const syntheticAggregatorImplementationAddressAfter = (
      await deployments.getDeploymentsFromAddress(syntheticAggregator.address)
    )[1].implementation;
    const upgradedImplementationAddress = deployed.implementation;

    const { syntheticAggregator: syntheticAggregatorAddressAfter } = await registry.getProtocolAddresses();

    expect(upgraded.address).to.be.eq(syntheticAggregator.address);
    expect(syntheticAggregatorImplementationAddressBefore).to.not.be.eq(syntheticAggregatorImplementationAddressAfter);
    expect(syntheticAggregatorAddressBefore).to.be.eq(syntheticAggregatorAddressAfter);
    expect(syntheticAggregatorImplementationAddressAfter).to.be.eq(upgradedImplementationAddress);

    const derivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);

    const margin = await upgraded.callStatic.getOrCacheMargin(hash, derivative);

    expect(margin.buyerMargin).to.be.equal(0);
    expect(margin.sellerMargin).to.be.equal(derivative.margin);
  });

  it("should upgrade OracleAggregator", async () => {
    const {
      contracts: { oracleAggregator, registry },
      users: { deployer },
    } = await setup();
    const { deployments, ethers } = hre;
    const { deploy } = deployments;
    const { oracleAggregator: oracleAggregatorAddressBefore } = await registry.getProtocolAddresses();

    await oracleAggregator.__callback(1, 10)

    const oracleAggregatorImplementationAddressBefore = (
      await deployments.getDeploymentsFromAddress(oracleAggregator.address)
    )[1].implementation;

    const deployed = await deploy("OracleAggregator", {
      contract: "TestOracleAggregatorUpgrade",
      from: deployer.address,
      log: true,
      proxy: {
        owner: deployer.address,
        proxyContract: "OpenZeppelinTransparentProxy"
      },
    });

    const upgraded = <TestOracleAggregatorUpgrade>(
      await ethers.getContractAt("TestOracleAggregatorUpgrade", deployed.address)
    );
    const oracleAggregatorImplementationAddressAfter = (
      await deployments.getDeploymentsFromAddress(upgraded.address)
    )[1].implementation;
    const upgradedImplementationAddress = deployed.implementation;

    const { oracleAggregator: oracleAggregatorAddressAfter } = await registry.getProtocolAddresses();

    await upgraded.__callback(2, 20)

    const oracleAggregatorTestData = await oracleAggregator.getData(deployer.address, 1)
    const upgradedOracleAggregatorTestData = await upgraded.getData(deployer.address, 1);
    const oracleAggregatorTestDataAfterUpgrade = await oracleAggregator.getData(deployer.address, 2);
    const upgradedOracleAggregatorTestDataAfterUpgrade = await upgraded.getData(deployer.address, 2);

    expect(await upgraded.placeholder(), "Unexpected value for placeholder function").to.be.eq('upgraded');
    expect(Object.keys(upgraded.functions).indexOf("placeholder") > -1, "Upgraded has unexpected function signature")
      .to.be.true;
    expect(Object.keys(oracleAggregator.functions).indexOf("placeholder") > -1, 'OracleAggregator has unexpected function signature').to.be.false;
    expect(oracleAggregatorTestData).to.be.eq(10);
    expect(upgradedOracleAggregatorTestData).to.be.eq(10);
    expect(upgradedOracleAggregatorTestDataAfterUpgrade).to.be.eq(20);
    expect(oracleAggregatorTestDataAfterUpgrade).to.be.eq(20);
    expect(upgraded.address).to.be.eq(oracleAggregator.address);
    expect(oracleAggregatorImplementationAddressBefore).to.not.be.eq(oracleAggregatorImplementationAddressAfter);
    expect(oracleAggregatorAddressBefore).to.be.eq(oracleAggregatorAddressAfter);
    expect(oracleAggregatorImplementationAddressAfter).to.be.eq(upgradedImplementationAddress);

  });

  it("should upgrade Core", async () => {
    const {
      contracts: { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry, oracleIdMock },
      users: { buyer, seller, governor, deployer },
    } = await setup();
    const { deployments, ethers } = hre;
    const { deploy } = deployments;

    const coreAddressBefore = await registry.getCore();
    const coreImplementationAddressBefore = (await deployments.getDeploymentsFromAddress(core.address))[1]
      .implementation;

    const [coreRegistryAddressesBefore, protocolCommissionsBefore] = await Promise.all([
      core.getProtocolAddresses(),
      core.getProtocolParametersArgs(),
    ]);

    const deployed = await deploy("Core", {
      contract: "TestCoreUpgrade",
      from: deployer.address,
      log: true,
      proxy: {
        owner: deployer.address,
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [registry.address],
          },
        },
      },
    });

    const upgraded = <TestCoreUpgrade>await ethers.getContractAt("TestCoreUpgrade", deployed.address);
    const coreImplementationAddressAfter = (await deployments.getDeploymentsFromAddress(core.address))[1]
      .implementation;
    const upgradedImplementationAddressAfter = (await deployments.getDeploymentsFromAddress(upgraded.address))[1]
      .implementation;
    const coreAddressAfter = await registry.getCore();

    const [coreRegistryAddressesAfter, protocolCommissionsBeforeAfter] = await Promise.all([
      upgraded.getProtocolAddresses(),
      upgraded.getProtocolParametersArgs(),
    ]);

    expect(upgraded.address).to.be.eq(core.address);
    expect(coreImplementationAddressBefore).to.not.be.eq(coreImplementationAddressAfter);
    expect(coreAddressBefore).to.be.eq(coreAddressAfter);
    expect(coreImplementationAddressAfter).to.be.eq(upgradedImplementationAddressAfter);
    expect(coreRegistryAddressesBefore, "different protocol's addresses").to.be.deep.eq(coreRegistryAddressesAfter);
    expect(protocolCommissionsBefore, "different protocol's commissions").to.be.deep.eq(protocolCommissionsBeforeAfter);
    expect(await upgraded.placeholder()).to.be.eq("upgraded");

    const derivativeOrder = await generateRandomDerivativeSetup(
      oracleIdMock.address,
      testToken.address,
      optionCallMock.address,
    );

    const oracleCallback = async () => {
      await oracleIdMock.triggerCallback(derivativeOrder.derivative.endTime, derivativeOrder.price);
    };

    await shouldBehaveLikeCore(upgraded).toCreateAndMintAndExecutePositions(
      registry,
      testToken,
      tokenSpender,
      opiumProxyFactory,
      oracleCallback,
      seller,
      buyer,
      derivativeOrder,
      EPositionCreation.CREATE,
    );
  });
});
