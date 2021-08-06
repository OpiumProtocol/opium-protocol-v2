import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { get } = deployments;

  await deployments.fixture([
    "Registry",
    "NewLibPosition",
    "OpiumProxyFactory",
    "Core",
    "TokenSpender",
    "OracleAggregator",
    "SyntheticAggregator",
  ]);

  const { deployer, governor } = await getNamedAccounts();

  const registry = await get("Registry");
  const tokenMinter = await get("OpiumProxyFactory");
  const core = await get("Core");
  const oracleAggregator = await get("OracleAggregator");
  const syntheticAggregator = await get("SyntheticAggregator");
  const tokenSpender = await get("TokenSpender");

  const registryInstance = await ethers.getContractAt("Registry", registry.address);

  registryInstance.init(
    tokenMinter.address,
    core.address,
    oracleAggregator.address,
    syntheticAggregator.address,
    tokenSpender.address,
    governor,
    { from: deployer },
  );
};

export default func;
func.tags = ["all"];
