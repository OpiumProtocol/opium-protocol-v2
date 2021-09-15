import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import {
  Core,
  OpiumProxyFactory,
  OptionCallSyntheticIdMock,
  OracleAggregator,
  OracleIdMock,
  Registry,
  SyntheticAggregator,
  TestToken,
  TokenSpender,
} from "../typechain";
import { toBN } from "./bn";

export type TContracts = {
  libPosition: Contract,
  registry: Registry,
  opiumProxyFactory: OpiumProxyFactory,
  tokenSpender: TokenSpender,
  core: Core,
  testToken: TestToken,
  optionCallMock: OptionCallSyntheticIdMock,
  oracleAggregator: OracleAggregator,
  syntheticAggregator: SyntheticAggregator,
  oracleIdMock: OracleIdMock,
};

const setup = async (): Promise<TContracts> => {
  const {deployer, governor} = await ethers.getNamedSigners();

  const Registry = await ethers.getContractFactory("Registry");
  const TokenSpender = await ethers.getContractFactory("TokenSpender");
  const OptionCallSyntheticIdMock = await ethers.getContractFactory("OptionCallSyntheticIdMock");
  const TestToken = await ethers.getContractFactory("TestToken");
  const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
  const SyntheticAggregator = await ethers.getContractFactory("SyntheticAggregator");
  const LibPosition = await ethers.getContractFactory("LibPosition");
  const OracleIdMock = await ethers.getContractFactory("OracleIdMock");
  const libPosition = await LibPosition.deploy();
  const Core = await ethers.getContractFactory("Core", {
    libraries: {
      LibPosition: libPosition.address,
    },
  });
  const OpiumProxyFactory = await ethers.getContractFactory("OpiumProxyFactory");
  const registry = <Registry>await upgrades.deployProxy(Registry, {initializer: 'initialize'});
  const opiumProxyFactory = <OpiumProxyFactory>await OpiumProxyFactory.deploy();
  const tokenSpender = <TokenSpender>await upgrades.deployProxy(TokenSpender, [governor.address], {initializer: 'initialize'});
  const core = <Core>await Core.deploy(registry.address);
  const oracleAggregator = <OracleAggregator>await OracleAggregator.deploy();
  const syntheticAggregator = <SyntheticAggregator>await SyntheticAggregator.deploy();
  const testToken = <TestToken>await TestToken.deploy("test", "test", 18);
  const optionCallMock = <OptionCallSyntheticIdMock>await OptionCallSyntheticIdMock.deploy();
  const oracleIdMock = <OracleIdMock>await OracleIdMock.deploy(toBN("0.1"), registry.address);

  const whitelist = [core.address];

  await tokenSpender.connect(governor).proposeWhitelist(whitelist);

  await registry.deployed();
  await tokenSpender.deployed();
  await libPosition.deployed();
  await core.deployed();
  await testToken.deployed();
  await syntheticAggregator.deployed();
  await opiumProxyFactory.deployed();
  await optionCallMock.deployed();
  await oracleIdMock.deployed();

  await registry.init(
    opiumProxyFactory.address,
    core.address,
    oracleAggregator.address,
    syntheticAggregator.address,
    tokenSpender.address,
    deployer.address,
  );

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
