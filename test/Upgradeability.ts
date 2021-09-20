import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import setup from "../utils/setup";
import { TNamedSigners } from "../hardhat.config";
import { OpiumPositionToken, OpiumProxyFactory, TestOracleAggregatorUpgrade, TestRegistryUpgrade, TestSyntheticAggregatorUpgrade, TestTokenSpenderUpgrade } from "../typechain";
import { derivativeFactory, getDerivativeHash } from "../utils/derivatives";
import { cast } from "../utils/bn";
import { TestCoreUpgrade } from "../typechain/TestCoreUpgrade";
import { SECONDS_40_MINS } from "../utils/constants";
import { decodeLogs } from "../utils/events";
import { formatAddress } from "../utils/addresses";

describe("Upgradeability", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it("should upgrade TokenSpender", async () => {
    const { core, tokenSpender, registry } = await setup();
    const { governor } = namedSigners;

    const tokenSpenderRegistryAddressBefore = await registry.getTokenSpender();
    const tokenSpenderImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(
      tokenSpender.address,
    );

    const timelockBefore = await tokenSpender.timeLockInterval();
    const governorAddressBefore = await tokenSpender.governor();
    const proposalTimeBefore = await tokenSpender.proposalTime();

    const TestTokenSpenderUpgrade = await ethers.getContractFactory("TestTokenSpenderUpgrade");
    const upgraded = <TestTokenSpenderUpgrade>(
      await upgrades.upgradeProxy(tokenSpender.address, TestTokenSpenderUpgrade)
    );
    const tokenSpenderImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(
      tokenSpender.address,
    );
    const upgradeImplementationAddress = await upgrades.erc1967.getImplementationAddress(tokenSpender.address);
    const tokenSpenderRegistryAddresAfter = await registry.getTokenSpender();

    expect(upgraded.address).to.be.eq(tokenSpender.address);
    expect(tokenSpenderImplementationAddressBefore).to.not.be.eq(tokenSpenderImplementationAddressAfter);
    expect(tokenSpenderImplementationAddressAfter).to.be.eq(upgradeImplementationAddress);
    expect(tokenSpenderRegistryAddressBefore).to.be.eq(tokenSpenderRegistryAddresAfter);

    const [timelockAfter, governorAddressAfter, proposalTimeAfter] = await upgraded.getAggregatedGovernance();
    expect(timelockBefore).to.be.eq(timelockAfter);
    expect(governorAddressBefore).to.be.eq(governorAddressAfter);
    expect(proposalTimeBefore).to.be.eq(proposalTimeAfter);

    await tokenSpender.connect(governor).proposeWhitelist([core.address]);
    const whitelist = await upgraded.callStatic.getWhitelist();
    expect(whitelist[0]).to.equal(core.address);
  });

  it("should upgrade Registry", async () => {
    const { registry, opiumProxyFactory, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
    const { deployer } = namedSigners;

    const registryOpiumAddressesBefore = await Promise.all([
      registry.getOpiumProxyFactory(),
      registry.getCore(),
      registry.getOracleAggregator(),
      registry.getSyntheticAggregator(),
      registry.getTokenSpender(),
    ]);
    const coreRegistryAddressBefore = await core.getRegistry();
    const registryImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(registry.address);

    const Registry = await ethers.getContractFactory("TestRegistryUpgrade");
    const upgraded = <TestRegistryUpgrade>await upgrades.upgradeProxy(registry.address, Registry);
    const registryImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(registry.address);
    const upgradedImplementationAddress = await upgrades.erc1967.getImplementationAddress(upgraded.address);

    try {
      await upgraded.init(
        opiumProxyFactory.address,
        core.address,
        oracleAggregator.address,
        syntheticAggregator.address,
        tokenSpender.address,
        deployer.address,
      );
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("REGISTRY:ALREADY_SET");
    }

    const coreRegistryAddressAfter = await core.getRegistry();

    expect(upgraded.address).to.be.eq(registry.address);
    expect(registryImplementationAddressBefore).to.not.be.eq(registryImplementationAddressAfter);
    expect(registryImplementationAddressAfter).to.be.eq(upgradedImplementationAddress);
    expect(coreRegistryAddressBefore).to.be.eq(coreRegistryAddressAfter);

    const registryOpiumAddressesAfter = await upgraded.getOpiumAddresses();

    expect(registryOpiumAddressesBefore).to.be.deep.eq(registryOpiumAddressesAfter);
  });

  it("should upgrade SyntheticAggregator", async() => {
    const { syntheticAggregator, optionCallMock, registry } = await setup();

    const syntheticAggregatorAddressBefore = await registry.getSyntheticAggregator();
    const syntheticAggregatorImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(syntheticAggregator.address);

    const SyntheticAggregatorUpgrade = await ethers.getContractFactory("TestSyntheticAggregatorUpgrade");
    const upgraded = <TestSyntheticAggregatorUpgrade>await upgrades.upgradeProxy(syntheticAggregator.address, SyntheticAggregatorUpgrade);
    const syntheticAggregatorImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(syntheticAggregator.address);
    const upgradedImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(upgraded.address);

    const syntheticAggregatorAddressAfter = await registry.getSyntheticAggregator();

    expect(upgraded.address).to.be.eq(syntheticAggregator.address);
    expect(syntheticAggregatorImplementationAddressBefore).to.not.be.eq(syntheticAggregatorImplementationAddressAfter);
    expect(syntheticAggregatorAddressBefore).to.be.eq(syntheticAggregatorAddressAfter);
    expect(syntheticAggregatorImplementationAddressAfter).to.be.eq(upgradedImplementationAddressAfter);

    const derivative = derivativeFactory({
      margin: cast(30),
      endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
      params: [200],
      syntheticId: optionCallMock.address,
    });

    const hash = getDerivativeHash(derivative);

    const margin = await upgraded.callStatic.getMargin(hash, derivative);

    expect(margin.buyerMargin).to.be.equal(0);
    expect(margin.sellerMargin).to.be.equal(derivative.margin);
  })

  it("should upgrade OracleAggregator", async() => {
    const { oracleAggregator, registry } = await setup();
    const { oracle } = namedSigners;

    const oracleAggregatorAddressBefore = await registry.getOracleAggregator();
    const oracleAggregatorImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(oracleAggregator.address);

    const OracleAggregatorUpgrade = await ethers.getContractFactory("TestOracleAggregatorUpgrade");
    const upgraded = <TestOracleAggregatorUpgrade>await upgrades.upgradeProxy(oracleAggregator.address, OracleAggregatorUpgrade);
    const oracleAggregatorImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(oracleAggregator.address);
    const upgradedImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(upgraded.address);
    const oracleAggregatorAddressAfter = await registry.getOracleAggregator();

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
  })

  it("should upgrade Core", async() => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry } = await setup();
    const { buyer, seller } = namedSigners;
    const endTime = ~~(Date.now() / 1000) + SECONDS_40_MINS; // Now + 40 mins

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

    /**
     * repeats the CoreCreation `should create OptionCall derivative` test with the upgraded core contract
     * TODO:
     * remove code duplication and set up test suites to keep it DRY
     */
    const amount = 3;
    const optionCall = derivativeFactory({
      margin: cast(30),
      endTime,
      params: [
        20000, // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await upgraded.create(optionCall, amount, [buyer.address, seller.address]);
    const receipt = await tx.wait();
    const log = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, "LogPositionTokenAddress", receipt);
    const shortPositionAddress = formatAddress(log[0].data);
    const longPositionAddress = formatAddress(log[1].data);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);

    expect(buyerPositionsLongBalance).to.equal(amount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(amount);
  })
});
