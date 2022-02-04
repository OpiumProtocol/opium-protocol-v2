import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { deploy, get } = deployments;

  const { deployer } = await ethers.getNamedSigners();

  const registry = await get("Registry");

  await deploy("OnChainDerivativeTracker", {
    from: deployer.address,
    log: true,
    args: [registry.address],
  });
};

export default func;
func.tags = ["Periphery"];
func.dependencies = ["Protocol"];
