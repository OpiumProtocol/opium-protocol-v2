import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import setup from "../utils/setup";
import { TNamedSigners } from "../hardhat.config";
import {
    TestRegistryUpgrade,
    TestTokenSpenderUpgrade,
  } from "../typechain";

describe("Upgradeability", () => {
    let namedSigners: TNamedSigners

    before(async() => {
      namedSigners = await ethers.getNamedSigners() as TNamedSigners;
    })

    it('should upgrade TokenSpender', async() => {
        const { core, tokenSpender, registry } = await setup();
        const { governor } = namedSigners;

        const tokenSpenderRegistryAddressBefore = await registry.getTokenSpender()
        const tokenSpenderImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(tokenSpender.address)

        const timelockBefore = await tokenSpender.timeLockInterval()
        const governorAddressBefore = await tokenSpender.governor()
        const proposalTimeBefore = await tokenSpender.proposalTime()

        const TestTokenSpenderUpgrade = await ethers.getContractFactory("TestTokenSpenderUpgrade")
        const upgraded = <TestTokenSpenderUpgrade>await upgrades.upgradeProxy(tokenSpender.address, TestTokenSpenderUpgrade)
        const tokenSpenderImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(tokenSpender.address)
        const upgradeImplementationAddress = await upgrades.erc1967.getImplementationAddress(tokenSpender.address)
        const tokenSpenderRegistryAddresAfter = await registry.getTokenSpender()

        expect(upgraded.address).to.be.eq(tokenSpender.address)
        expect(tokenSpenderImplementationAddressBefore).to.not.be.eq(tokenSpenderImplementationAddressAfter)
        expect(tokenSpenderImplementationAddressAfter).to.be.eq(upgradeImplementationAddress)
        expect(tokenSpenderRegistryAddressBefore).to.be.eq(tokenSpenderRegistryAddresAfter)

        const [timelockAfter, governorAddressAfter, proposalTimeAfter] = await upgraded.getAggregatedGovernance()
        expect(timelockBefore).to.be.eq(timelockAfter)
        expect(governorAddressBefore).to.be.eq(governorAddressAfter)
        expect(proposalTimeBefore).to.be.eq(proposalTimeAfter)

        await tokenSpender.connect(governor).proposeWhitelist([ core.address ])
        const whitelist = await upgraded.callStatic.getWhitelist()
        expect(whitelist[0]).to.equal(core.address)
    })

    it('should upgrade Registry', async() => {
        const { registry, opiumProxyFactory, core, oracleAggregator, syntheticAggregator, tokenSpender } = await setup();
        const { deployer } = namedSigners;

        const registryOpiumAddressesBefore = await Promise.all([registry.getOpiumProxyFactory(), registry.getCore(), registry.getOracleAggregator(), registry.getSyntheticAggregator(), registry.getTokenSpender()])
        const coreRegistryAddressBefore = await core.getRegistry()
        const registryImplementationAddressBefore = await upgrades.erc1967.getImplementationAddress(registry.address)

        const Registry = await ethers.getContractFactory("TestRegistryUpgrade");
        const upgraded = <TestRegistryUpgrade>await upgrades.upgradeProxy(registry.address, Registry)
        const registryImplementationAddressAfter = await upgrades.erc1967.getImplementationAddress(registry.address)
        const upgradedImplementationAddress = await upgrades.erc1967.getImplementationAddress(upgraded.address)
     
        try {
            await upgraded.init(
                opiumProxyFactory.address,
                core.address,
                oracleAggregator.address,
                syntheticAggregator.address,
                tokenSpender.address,
                deployer.address,
            );
        } catch(error) {
            const { message } = error as Error
            expect(message).to.include("REGISTRY:ALREADY_SET");
        }

        const coreRegistryAddressAfter = await core.getRegistry()

        expect(upgraded.address).to.be.eq(registry.address)
        expect(registryImplementationAddressBefore).to.not.be.eq(registryImplementationAddressAfter)
        expect(registryImplementationAddressAfter).to.be.eq(upgradedImplementationAddress)
        expect(coreRegistryAddressBefore).to.be.eq(coreRegistryAddressAfter)

        const registryOpiumAddressesAfter = await upgraded.getOpiumAddresses();

        expect(registryOpiumAddressesBefore).to.be.deep.eq(registryOpiumAddressesAfter)
    })
})
