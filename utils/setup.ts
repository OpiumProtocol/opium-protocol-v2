import {
  Core,
  OptionCallSyntheticIdMock,
  OracleAggregator,
  OracleIdMock,
  Registry,
  SyntheticAggregator,
  TestToken,
  TokenMinter,
  TokenSpender,
} from "../typechain";
import { ethers } from "hardhat";
import { toBN } from "./bn";
import { Contract } from "ethers";

const baseTokenURI = "https://explorer.opium.network/erc721o/";

export type TContracts = {
  libPosition: Contract,
  registry: Registry,
  tokenMinter: TokenMinter,
  tokenSpender: TokenSpender,
  core: Core,
  testToken: TestToken,
  optionCallMock: OptionCallSyntheticIdMock,
  oracleAggregator: OracleAggregator,
  syntheticAggregator: SyntheticAggregator,
  oracleIdMock: OracleIdMock,
};

const setup = async (): Promise<TContracts> => {
  const {deployer} = await ethers.getNamedSigners();

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
  const TokenMinter = await ethers.getContractFactory("TokenMinter", {
    libraries: {
      LibPosition: libPosition.address,
    },
  });

  const registry = <Registry>await Registry.deploy();
  const tokenMinter = <TokenMinter>await TokenMinter.deploy(baseTokenURI, registry.address);
  const tokenSpender = <TokenSpender>await TokenSpender.deploy(deployer.address);
  const core = <Core>await Core.deploy(registry.address);
  const oracleAggregator = <OracleAggregator>await OracleAggregator.deploy();
  const syntheticAggregator = <SyntheticAggregator>await SyntheticAggregator.deploy();
  const testToken = <TestToken>await TestToken.deploy("test", "test", 18);
  const optionCallMock = <OptionCallSyntheticIdMock>await OptionCallSyntheticIdMock.deploy();
  const oracleIdMock = <OracleIdMock>await OracleIdMock.deploy(toBN("0.1"), registry.address);

  const whitelist = [core.address];

  await tokenSpender.proposeWhitelist(whitelist, { from: deployer.address });

  await registry.deployed();
  await tokenSpender.deployed();
  await libPosition.deployed();
  await core.deployed();
  await testToken.deployed();
  await syntheticAggregator.deployed();
  await tokenMinter.deployed();
  await optionCallMock.deployed();
  await oracleIdMock.deployed();

  await registry.init(
    tokenMinter.address,
    core.address,
    oracleAggregator.address,
    syntheticAggregator.address,
    tokenSpender.address,
    deployer.address,
    { from: deployer.address },
  );

  return {
    libPosition,
    registry,
    tokenMinter,
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
