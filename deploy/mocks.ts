import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { toBN } from "../utils/bn";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { deploy, get } = deployments;

  const { deployer, author } = await ethers.getNamedSigners();

  const registry = await get("Registry");

  await deploy("OptionCallSyntheticIdMock", {
    from: author.address,
    log: true,
  });

  await deploy("OptionPutPartSyntheticId", {
    from: author.address,
    log: true,
    args: [author.address, toBN("1")],
  });

  await deploy("OptionPutSyntheticIdMock", {
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

  await deploy("MaliciousTestToken", {
    from: deployer.address,
    contract: "MaliciousTestToken",
    log: true,
    args: ["test", "test", 18],
  });
};

export default func;
func.tags = ["Mocks"];
func.dependencies = ["Protocol"];
