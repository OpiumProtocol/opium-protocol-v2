import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import {
  Core,
  OpiumProxyFactory,
  OptionCallSyntheticIdMock,
  OracleAggregator,
  OracleIdMock,
  RegistryUpgradeable,
  SyntheticAggregator,
  TestToken,
  TokenSpender,
} from "../typechain";
import { toBN } from "./bn";

export type TContracts = {
  libPosition: Contract;
  registry: RegistryUpgradeable;
  opiumProxyFactory: OpiumProxyFactory;
  tokenSpender: TokenSpender;
  core: Core;
  testToken: TestToken;
  optionCallMock: OptionCallSyntheticIdMock;
  oracleAggregator: OracleAggregator;
  syntheticAggregator: SyntheticAggregator;
  oracleIdMock: OracleIdMock;
};

const setup = async (): Promise<TContracts> => {
  const { deployer, governor, longExecutorOne, longExecutorTwo, shortExecutorOne, shortExecutorTwo } =
    await ethers.getNamedSigners();

  const Registry = await ethers.getContractFactory("RegistryUpgradeable");
  const TokenSpender = await ethers.getContractFactory("TokenSpender");
  const OptionCallSyntheticIdMock = await ethers.getContractFactory("OptionCallSyntheticIdMock");
  const TestToken = await ethers.getContractFactory("TestToken");
  const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
  const SyntheticAggregator = await ethers.getContractFactory("SyntheticAggregator");
  const LibPosition = await ethers.getContractFactory("LibPosition");
  const OracleIdMock = await ethers.getContractFactory("OracleIdMock");
  const libPosition = await LibPosition.deploy();
  const Core = await ethers.getContractFactory("Core");
  const OpiumProxyFactory = await ethers.getContractFactory("OpiumProxyFactory");
  const registry = <RegistryUpgradeable>(
    await upgrades.deployProxy(
      Registry,
      [
        governor.address,
        [longExecutorOne.address, longExecutorTwo.address],
        [shortExecutorOne.address, shortExecutorTwo.address],
      ],
      { initializer: "initialize" },
    )
  );

  const opiumProxyFactory = <OpiumProxyFactory>await OpiumProxyFactory.deploy(registry.address);
  const tokenSpender = <TokenSpender>(
    await upgrades.deployProxy(TokenSpender, [registry.address], { initializer: "initialize" })
  );
  const core = <Core>await upgrades.deployProxy(Core, [registry.address], { initializer: "initialize" });
  const oracleAggregator = <OracleAggregator>await upgrades.deployProxy(OracleAggregator);
  const syntheticAggregator = <SyntheticAggregator>(
    await upgrades.deployProxy(SyntheticAggregator, [registry.address], { initializer: "initialize" })
  );
  const testToken = <TestToken>await TestToken.deploy("test", "test", 18);

  const optionCallMock = <OptionCallSyntheticIdMock>await OptionCallSyntheticIdMock.deploy();
  const oracleIdMock = <OracleIdMock>await OracleIdMock.deploy(toBN("0.1"), registry.address);

  await registry.deployed();
  await tokenSpender.deployed();
  await libPosition.deployed();
  await core.deployed();
  await testToken.deployed();
  await syntheticAggregator.deployed();
  await opiumProxyFactory.deployed();
  await optionCallMock.deployed();
  await oracleIdMock.deployed();

  await registry
    .connect(governor)
    .registerProtocol(
      opiumProxyFactory.address,
      core.address,
      oracleAggregator.address,
      syntheticAggregator.address,
      tokenSpender.address,
      deployer.address,
    );

  await registry.connect(governor).addToWhitelist(core.address);

  return {
    libPosition,
    registry,
    opiumProxyFactory,
    tokenSpender,
    core,
    testToken,
    optionCallMock,
    oracleAggregator,
    syntheticAggregator,
    oracleIdMock,
  };
};

export default setup;
