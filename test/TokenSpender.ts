import { artifacts, deployments, ethers } from "hardhat";
import { expect } from "chai";
import setup from "../utils/setup";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { toBN } from "../utils/bn";
import { TokenSpender } from "../typechain";
import timeTravel from "../utils/timeTravel";
import { TNamedSigners } from "../hardhat.config";

describe("TokenSpender", () => {
    let tokenSpender: TokenSpender
    let dai: MockContract

    let namedSigners: TNamedSigners

    before(async() => {
        ( namedSigners = await ethers.getNamedSigners() as TNamedSigners);
        const { deployer } = namedSigners


        await deployments.fixture(['TokenSpender'])
        const tokenSpenderDeployment = await deployments.get('TokenSpender')
        tokenSpender = <TokenSpender>await ethers.getContractAt("TokenSpender", tokenSpenderDeployment.address)

        dai = await deployMockContract(deployer, (await artifacts.readArtifact("TestToken")).abi);
    })

    it('should revert proposing by non governor address', async () => {
        const { core } = await setup();
        const { notAllowed } = namedSigners

        try {
            await tokenSpender.connect(notAllowed).proposeWhitelist([ core.address ])
        } catch (error) {
            expect(error.message).to.include('Only governor allowed')
        }
    })

    it('should be successfully propose initial whitelist by governor address', async () => {
        const { core } = await setup();
        const { governor } = namedSigners

        await tokenSpender.connect(governor).proposeWhitelist([ core.address ])
        const whitelist = await tokenSpender.callStatic.getWhitelist()
        expect(whitelist[0]).to.equal(core.address)
    })

    it('should revert spending by non whitelisted address', async () => {
        try {
            const { deployer, hacker } = namedSigners;

            await tokenSpender.claimTokens(dai.address, deployer.address, hacker.address, toBN('0.01'))
        } catch (error) {
            expect(error.message).to.include('Only whitelisted allowed')
        }
    })

    it('should successfully spend by core', async () => {
        // Preps
        const { testToken } = await setup();
        const {deployer, governor, goodGuy, authorized} = namedSigners;
        await tokenSpender.connect(governor).proposeWhitelist([ authorized.address ])
        const proposalTimelock = 3600
        await timeTravel(proposalTimelock)

        await testToken.mint(authorized.address, toBN('1'))
        await tokenSpender.connect(governor).commitWhitelist()

        await testToken.approve(tokenSpender.address, toBN('0.01'))

        await tokenSpender.connect(authorized).claimTokens(testToken.address, deployer.address, goodGuy.address, toBN('0.01'))
        
        expect(await testToken.connect(goodGuy).balanceOf(goodGuy.address)).to.equal(toBN('0.01'))
    })

    it('should revert commitment before proposal', async () => {
        try {
            const { governor } = namedSigners;

            await tokenSpender.connect(governor).commitWhitelist()
        } catch (error) {
            expect(error.message).to.include(`Didn't proposed yet`)
        }
    })

    it('should revert proposal for empty list', async () => {
        try {
            const { governor } = namedSigners;
            await tokenSpender.connect(governor).proposeWhitelist([])
        } catch (error) {
            expect(error.message).to.include(`Can't be empty'`)
        }
    })

    it('should be successfully propose new addresses by governor address, but keep old till time lock', async () => {
        const {libPosition, registry } = await setup()
        const { governor } = namedSigners;

        const oldWhitelist = await tokenSpender.getWhitelist()
        
        const Core = await ethers.getContractFactory("Core", {
            libraries: {
                NewLibPosition: libPosition.address,
            },
        });
        const newCore = await Core.deploy(registry.address);
        await newCore.deployed();

        await tokenSpender.connect(governor).proposeWhitelist([ newCore.address ])

        const newWhitelist = await tokenSpender.getWhitelist()
        expect(newWhitelist[0]).to.be.equal(oldWhitelist[0])
    })

    it('should revert commitment by non governor address', async () => {
        try {
            const { notAllowed } = namedSigners;
            await tokenSpender.connect(notAllowed).commitWhitelist()
        } catch (error) {
            expect(error.message).to.include('Only governor allowed')
        }
    })

    it('should revert commitment before time lock', async () => {
        try {
            const { governor } = namedSigners;
            await tokenSpender.connect(governor).commitWhitelist()
        } catch (error) {
            expect(error.message).to.include(`Can't commit yet`)
        }
    })

    it('should successfully commit new whitelist after time lock', async () => {
        const {libPosition, registry } = await setup()
        const { governor } = namedSigners;
        
        const Core = await ethers.getContractFactory("Core", {
            libraries: {
                NewLibPosition: libPosition.address,
            },
        });
        const newCore = await Core.deploy(registry.address);
        await newCore.deployed();
        
        await tokenSpender.connect(governor).proposeWhitelist([ newCore.address ])

        await timeTravel(15 * 24 * 60 * 60) // Travel 15 days forward
        await tokenSpender.connect(governor).commitWhitelist()

        const whitelist = await tokenSpender.getWhitelist()
        expect(whitelist[0]).to.be.equal(newCore.address)
    })

})