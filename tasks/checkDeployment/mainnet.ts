import { task } from "hardhat/config";
import { Registry, Core, TokenSpender, OpiumProxyFactory, OracleAggregator, SyntheticAggregator } from "../../typechain";

const ECOSYSTEM = '0xdbc2f7f3bccccf54f1bda43c57e8ab526e379df1';

const compareValues = (title: string, a: string, b: string) => {
  console.log(title, a === b ? '✅ CORRECT' : `❌ INCORRECT: expected ${a} to be equal to ${b}`)
}

task('checkDeployment:mainnet', "Overrides the standard clean task", async function (_taskArgs, _hre) {
  const { ethers, network } = _hre;

  if (network.name !== "mainnet") {
    throw new Error('Wrong network')
  }

  const registryInstance = <Registry>await ethers.getContract("Registry");
  const coreInstance = <Core>await ethers.getContract("Core");
  const tokenSpenderInstance = <TokenSpender>await ethers.getContract("TokenSpender");
  const opiumProxyFactoryInstance = <OpiumProxyFactory>await ethers.getContract("OpiumProxyFactory");
  const oracleAggregatorInstance = <OracleAggregator>await ethers.getContract("OracleAggregator");
  const syntheticAggregatorInstance = <SyntheticAggregator>await ethers.getContract("SyntheticAggregator");

  //// Check addresses
  // Registry
  const registryAddresses = await registryInstance.getProtocolAddresses()
  compareValues('Registry: core address check', registryAddresses.core.toLowerCase(), coreInstance.address.toLowerCase())
  compareValues('Registry: opiumProxyFactory address check', registryAddresses.opiumProxyFactory.toLowerCase(), opiumProxyFactoryInstance.address.toLowerCase())
  compareValues('Registry: oracleAggregator address check', registryAddresses.oracleAggregator.toLowerCase(), oracleAggregatorInstance.address.toLowerCase())
  compareValues('Registry: syntheticAggregator address check', registryAddresses.syntheticAggregator.toLowerCase(), syntheticAggregatorInstance.address.toLowerCase())
  compareValues('Registry: tokenSpender address check', registryAddresses.tokenSpender.toLowerCase(), tokenSpenderInstance.address.toLowerCase())
  compareValues('Registry: protocolExecutionReserveClaimer address check', registryAddresses.protocolExecutionReserveClaimer.toLowerCase(), ECOSYSTEM.toLowerCase())
  compareValues('Registry: protocolRedemptionReserveClaimer address check', registryAddresses.protocolRedemptionReserveClaimer.toLowerCase(), ECOSYSTEM.toLowerCase())

  const coreIsWhitelisted = await registryInstance.isCoreSpenderWhitelisted(coreInstance.address)
  compareValues('Registry: core is whitelisted check', coreIsWhitelisted.toString(), 'true')

  // Core
  const coreAddresses = await coreInstance.getProtocolAddresses()
  const coreRegistryAddress = await coreInstance.getRegistry()
  compareValues('Core: core address check', coreAddresses.core.toLowerCase(), coreInstance.address.toLowerCase())
  compareValues('Core: opiumProxyFactory address check', coreAddresses.opiumProxyFactory.toLowerCase(), opiumProxyFactoryInstance.address.toLowerCase())
  compareValues('Core: oracleAggregator address check', coreAddresses.oracleAggregator.toLowerCase(), oracleAggregatorInstance.address.toLowerCase())
  compareValues('Core: syntheticAggregator address check', coreAddresses.syntheticAggregator.toLowerCase(), syntheticAggregatorInstance.address.toLowerCase())
  compareValues('Core: tokenSpender address check', coreAddresses.tokenSpender.toLowerCase(), tokenSpenderInstance.address.toLowerCase())
  compareValues('Core: protocolExecutionReserveClaimer address check', coreAddresses.protocolExecutionReserveClaimer.toLowerCase(), ECOSYSTEM.toLowerCase())
  compareValues('Core: protocolRedemptionReserveClaimer address check', coreAddresses.protocolRedemptionReserveClaimer.toLowerCase(), ECOSYSTEM.toLowerCase())
  compareValues('Core: registry address check', coreRegistryAddress.toLowerCase(), registryInstance.address.toLowerCase())

  // TokenSpender
  const tokenSpenderRegistryAddress = await tokenSpenderInstance.getRegistry()
  compareValues('TokenSpender: registry address check', tokenSpenderRegistryAddress.toLowerCase(), registryInstance.address.toLowerCase())
  
  // OpiumProxyFactory
  const opiumProxyFactoryRegistryAddress = await opiumProxyFactoryInstance.getRegistry()
  compareValues('OpiumProxyFactory: registry address check', opiumProxyFactoryRegistryAddress.toLowerCase(), registryInstance.address.toLowerCase())
  
  // SyntheticAggregator
  const syntheticAggregatorRegistryAddress = await syntheticAggregatorInstance.getRegistry()
  compareValues('SyntheticAggregator: registry address check', syntheticAggregatorRegistryAddress.toLowerCase(), registryInstance.address.toLowerCase())

  //// Check params
  // Registry
  const registryParams = await registryInstance.getProtocolParameters()
  compareValues('Registry: noDataCancellationPeriod check', registryParams.noDataCancellationPeriod.toString(), (14 * 24 * 3600).toString())
  compareValues('Registry: derivativeAuthorExecutionFeeCap check', registryParams.derivativeAuthorExecutionFeeCap.toString(), (1000).toString())
  compareValues('Registry: derivativeAuthorRedemptionReservePart check', registryParams.derivativeAuthorRedemptionReservePart.toString(), (0).toString())
  compareValues('Registry: protocolExecutionReservePart check', registryParams.protocolExecutionReservePart.toString(), (0).toString())
  compareValues('Registry: protocolRedemptionReservePart check', registryParams.protocolRedemptionReservePart.toString(), (0).toString())

  // Core
  const coreParams = await coreInstance.getProtocolParametersArgs()
  compareValues('Core: noDataCancellationPeriod check', coreParams.noDataCancellationPeriod.toString(), (14 * 24 * 3600).toString())
  compareValues('Core: derivativeAuthorExecutionFeeCap check', coreParams.derivativeAuthorExecutionFeeCap.toString(), (1000).toString())
  compareValues('Core: derivativeAuthorRedemptionReservePart check', coreParams.derivativeAuthorRedemptionReservePart.toString(), (0).toString())
  compareValues('Core: protocolExecutionReservePart check', coreParams.protocolExecutionReservePart.toString(), (0).toString())
  compareValues('Core: protocolRedemptionReservePart check', coreParams.protocolRedemptionReservePart.toString(), (0).toString())

  //// Check roles

  //// Check Governance
  const abi = [
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
  const defaultProxyAdminInstance = await ethers.getContractAt(abi, "0x2Ba5feE02489c4c7D550b82044742084A652F01A")
  const defaultProxyAdminOwner = await defaultProxyAdminInstance.owner()
  compareValues('DefaultProxyAdmin: owner check', defaultProxyAdminOwner.toLowerCase(), ECOSYSTEM.toLowerCase())
});
