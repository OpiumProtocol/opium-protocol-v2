import { task } from "hardhat/config";
import { OpiumPositionToken, Registry } from './../typechain';

const OpiumPositionTokenAddress = "0x6384f8070fda183e2b8ce0d521c0a9e7606e30ea"
const RegistryImplementationAddress = "0x845a7872d1cDe2B3285dE9f66B1D2EC70307cC6b"
const ecosystem = "0x964C04B87D14dF4aa74169874C4B15A87EED360d";

task('initialize:OpiumPositionToken', "Initialize OpiumPositionToken implementation", async function (_taskArgs, _hre) {
  const { ethers } = _hre;
  const { deployer } = await ethers.getNamedSigners();

  const opiumPositionTokenImplementation = <OpiumPositionToken>await ethers.getContractAt(
    "OpiumPositionToken",
    OpiumPositionTokenAddress
  );

  const hash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const type = 0
  const derivative = {
    margin: "0",
    endTime: "0",
    params: [],
    oracleId: "0x0000000000000000000000000000000000000000",
    token: "0x0000000000000000000000000000000000000000",
    syntheticId: "0x0000000000000000000000000000000000000000"
  }

  const tx = await opiumPositionTokenImplementation
    .connect(deployer)
    .initialize(
      hash,
      type,
      derivative
    );
  
    await tx.wait();

    console.log('Initialized')
});

task('initialize:Registry', "Initialize Registry implementation", async function (_taskArgs, _hre) {
  const { ethers } = _hre;
  const { deployer } = await ethers.getNamedSigners();

  const registryImplementation = <Registry>await ethers.getContractAt(
    "Registry",
    RegistryImplementationAddress
  );

  const tx = await registryImplementation
    .connect(deployer)
    .initialize(
      ecosystem
    );
  
    await tx.wait();

    console.log('Initialized')
});
