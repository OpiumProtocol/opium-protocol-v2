import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Core, Registry } from "../../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments, ethers, network } = hre;
  const { deploy } = deployments;

  const { deployer, governor } = await ethers.getNamedSigners();

  // Skip if network is not Polygon Mumbai
  if (network.name !== 'polygonMumbai') {
    return false
  }

  const registry = await deploy("Registry", {
    from: deployer.address,
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [governor.address],
        },
      },
    },
  });

  const core = await deploy("Core", {
    from: deployer.address,
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [registry.address],
        },
      },
    },
  });

  const tokenSpender = await deploy("TokenSpender", {
    contract: "TokenSpender",
    from: deployer.address,
    args: [],
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [registry.address],
        },
      },
    },
  });

  const opiumProxyFactory = await deploy("OpiumProxyFactory", {
    from: deployer.address,
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [registry.address],
        },
      },
    },
  });

  const oracleAggregator = await deploy("OracleAggregator", {
    from: deployer.address,
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
    },
  });

  const syntheticAggregator = await deploy("SyntheticAggregator", {
    from: deployer.address,
    log: true,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [registry.address],
        },
      },
    },
  });

  const registryInstance = <Registry>await ethers.getContract("Registry");

  const tx1 = await registryInstance
    .connect(governor)
    .setProtocolAddresses(
      opiumProxyFactory.address,
      core.address,
      oracleAggregator.address,
      syntheticAggregator.address,
      tokenSpender.address,
    );
  await tx1.wait();

  const tx2 = await registryInstance.connect(governor).setProtocolExecutionReserveClaimer(deployer.address);
  await tx2.wait();

  const tx3 = await registryInstance
    .connect(governor)
    .setProtocolRedemptionReserveClaimer(governor.address);
  await tx3.wait();

  const tx4 = await registryInstance.connect(governor).addToWhitelist(core.address);
  await tx4.wait();

  const coreInstance = <Core>await ethers.getContract("Core");

  const tx5 = await coreInstance.connect(governor).updateProtocolAddresses();
  await tx5.wait();

  return true;
};

export default func;
func.id = '01_protocol';
func.tags = ["Protocol"];
