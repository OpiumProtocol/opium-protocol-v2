import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments, ethers, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await ethers.getNamedSigners();

  // Skip if network is not Polygon Mumbai
  if (network.name !== 'polygonMumbai') {
    return false
  }

  await deploy("BalanceHelper", {
    from: deployer.address,
    log: true,
  });

  await deploy("PayoutHelper", {
    from: deployer.address,
    log: true,
  });

  return true;
};

export default func;
func.id = "02_protocol_periphery";
func.tags = ["Periphery"];
func.dependencies = ["Protocol"];
