import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments, ethers, network } = hre;
  const { deploy, get } = deployments;

  const { deployer } = await ethers.getNamedSigners();

  // Skip if network is not Polygon Mainnet
  if (network.name !== 'polygonMainnet') {
    return false
  }

  const registry = await get("Registry");

  await deploy("OnChainPositionsLens", {
    from: deployer.address,
    log: true,
    args: [registry.address],
  });

  return true;
};

export default func;
func.id = "02_periphery_lens";
func.tags = ["Periphery"];
func.dependencies = ["Protocol"];
