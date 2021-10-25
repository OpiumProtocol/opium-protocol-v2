import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Core, RegistryUpgradeable } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { deploy } = deployments;

  const { deployer, governor } = await ethers.getNamedSigners();

  const registry = await deploy("RegistryUpgradeable", {
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

  const registryInstance = <RegistryUpgradeable>await ethers.getContract("RegistryUpgradeable");

  await registryInstance
    .connect(governor)
    .registerProtocol(
      opiumProxyFactory.address,
      core.address,
      oracleAggregator.address,
      syntheticAggregator.address,
      tokenSpender.address,
      deployer.address,
    );

  await registryInstance.connect(governor).addToWhitelist(core.address);

  const coreInstance = <Core>await ethers.getContract("Core");
  coreInstance.updateProtocolAddresses()

};

export default func;
func.tags = ["Protocol"];
