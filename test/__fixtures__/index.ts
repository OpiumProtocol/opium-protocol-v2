import { deployments, ethers } from "hardhat";
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
} from "../../typechain";

export type TContracts = {
  registry: RegistryUpgradeable;
  opiumProxyFactory: OpiumProxyFactory;
  tokenSpender: TokenSpender;
  core: Core;
  testToken: TestToken;
  optionCallMock: OptionCallSyntheticIdMock;
  oracleAggregator: OracleAggregator;
  syntheticAggregator: SyntheticAggregator;
  oracleIdMock: OracleIdMock;
  testTokenSixDecimals: TestToken;
};

const setup = deployments.createFixture(async (): Promise<TContracts> => {
  await deployments.fixture(["Protocol", "Mocks"]);

  /*******************
   * PROTOCOL
   ********************/
  const registry = <RegistryUpgradeable>await ethers.getContract("RegistryUpgradeable");
  const opiumProxyFactory = <OpiumProxyFactory>await ethers.getContract("OpiumProxyFactory");
  const core = <Core>await ethers.getContract("Core");
  const oracleAggregator = <OracleAggregator>await ethers.getContract("OracleAggregator");
  const syntheticAggregator = <SyntheticAggregator>await ethers.getContract("SyntheticAggregator");
  const tokenSpender = <TokenSpender>await ethers.getContract("TokenSpender");

  /*******************
   * MOCKS
   ********************/

  const optionCallMock = <OptionCallSyntheticIdMock>await ethers.getContract("OptionCallSyntheticIdMock");
  const oracleIdMock = <OracleIdMock>await ethers.getContract("OracleIdMock");

  const testToken = <TestToken>await ethers.getContract("TestToken");
  const testTokenSixDecimals = <TestToken>await ethers.getContract("SixDecimalsTestToken");

  return {
    registry,
    opiumProxyFactory,
    tokenSpender,
    core,
    testToken,
    optionCallMock,
    oracleAggregator,
    syntheticAggregator,
    oracleIdMock,
    testTokenSixDecimals,
  };
});

export default setup;
