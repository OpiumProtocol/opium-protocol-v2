import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const baseTokenURI = "https://explorer.opium.network/erc721o/";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;

  const { deployer } = await getNamedAccounts();

  const registry = await get("Registry");
  const libPosition = await get("LibPosition");

  await deploy("OpiumProxyFactory", {
    from: deployer,
    args: [baseTokenURI, registry.address],
    libraries: {
      LibPosition: libPosition.address,
    },
    log: true,
  });
};

export default func;
func.tags = ["OpiumProxyFactory"];
