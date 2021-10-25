import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { toBN } from "../utils/bn";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { deploy, get } = deployments;

  const { deployer, author } = await ethers.getNamedSigners();

  const registry = await get("RegistryUpgradeable");

  await deploy("OptionCallSyntheticIdMock", {
    from: author.address,
    log: true,
  });

  await deploy("OracleIdMock", {
    from: deployer.address,
    log: true,
    args: [toBN("0.1"), registry.address],
  });

  await deploy("TestToken", {
    from: deployer.address,
    contract: "TestToken",
    log: true,
    args: ["test", "test", 18],
  });

  await deploy("SixDecimalsTestToken", {
    from: deployer.address,
    contract: "TestToken",
    log: true,
    args: ["test", "test", 6],
  });
};

export default func;
func.tags = ["Mocks"];
func.dependencies = ["Protocol"];
