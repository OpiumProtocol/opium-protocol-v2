import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { toBN } from "../../utils/bn";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments, ethers, network } = hre;
  const { deploy, get } = deployments;

  const { deployer, author } = await ethers.getNamedSigners();

  // Skip if network is not Arbitrum Testnet
  if (network.name !== 'arbitrumTestnet') {
    return false
  }

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

  return true;
};

export default func;
func.id = "02_test_mocks";
func.tags = ["Mocks"];
func.dependencies = ["Protocol"];
