import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("TestToken", {
    from: deployer,
    args: ["test", "test", 18],
    log: true,
  });

  await deploy("OptionCallSyntheticIdMock", {
    from: deployer,
    log: true,
  });
};

export default func;
func.tags = ["mocks"];
