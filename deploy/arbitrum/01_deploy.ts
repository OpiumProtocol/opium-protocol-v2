import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const ECOSYSTEM = '0xc9162e9e8A6C47E7346a3fe6Dda9fab54Dfbe49B';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments, ethers, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await ethers.getNamedSigners();

  // Skip if network is not Arbitrum Mainnet
  if (network.name !== 'arbitrum') {
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
          args: [ECOSYSTEM],
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

  // Ecosystem DAO Setup Instructions

  console.log(
    'Tx #1',
    `Registry @ ${registry.address}`,
    'setProtocolAddresses',
    [
      opiumProxyFactory.address,
      core.address,
      oracleAggregator.address,
      syntheticAggregator.address,
      tokenSpender.address,
    ]
  )

  console.log(
    'Tx #2',
    `Registry @ ${registry.address}`,
    'setProtocolExecutionReserveClaimer',
    [
      ECOSYSTEM,
    ]
  )

  console.log(
    'Tx #3',
    `Registry @ ${registry.address}`,
    'setProtocolRedemptionReserveClaimer',
    [
      ECOSYSTEM,
    ]
  )

  console.log(
    'Tx #4',
    `Registry @ ${registry.address}`,
    'setDerivativeAuthorRedemptionReservePart',
    [
      0,
    ]
  )

  console.log(
    'Tx #5',
    `Registry @ ${registry.address}`,
    'setProtocolExecutionReservePart',
    [
      0,
    ]
  )

  console.log(
    'Tx #6',
    `Registry @ ${registry.address}`,
    'setProtocolRedemptionReservePart',
    [
      0,
    ]
  )

  console.log(
    'Tx #7',
    `Registry @ ${registry.address}`,
    'addToWhitelist',
    [
      core.address,
    ]
  )

  console.log(
    'Tx #8',
    `Core @ ${core.address}`,
    'updateProtocolAddresses',
    []
  )

  console.log(
    'Tx #9',
    `Core @ ${core.address}`,
    'updateProtocolParametersArgs',
    []
  )

  // Deployer Setup Instructions
  console.log('----------------------')
  console.log(`#1 Transfer ownership of ProxyAdmin to DAO @ ${ECOSYSTEM}`)
  console.log('#2 call all initializers on implementation contracts', [
    'implementation of Registry',
    'implementation of Core',
    'implementation of TokenSpender',
    'implementation of OpiumProxyFactory',
    'implementation of OracleAggregator',
    'implementation of SyntheticAggregator',
    'OpiumProxyFactory.getImplementationAddress()'
  ])

  return true;
};

export default func;
func.id = '01_protocol';
func.tags = ["Protocol"];
