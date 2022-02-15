import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments, ethers } = hre;
  const { deploy, get } = deployments;

  const { deployer } = await ethers.getNamedSigners();

  const registry = await get("Registry");

  await deploy("OnChainPositionsLens", {
    from: deployer.address,
    log: true,
    args: [registry.address],
  });

  return true;
};

export default func;
func.id = "03_protocol_periphery";
func.tags = ["Periphery"];
func.dependencies = ["Protocol"];
