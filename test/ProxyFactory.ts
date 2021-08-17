import { ethers } from "hardhat";
import { expect } from "chai";
import setup from "../utils/setup";
import { TNamedSigners } from "../hardhat.config";
import { OpiumPositionToken } from "../typechain";
import { TestOpiumProxyFactory } from "../typechain/TestOpiumProxyFactory";
import { derivativeFactory, getDerivativeHash, TDerivative } from "../utils/derivatives";

describe("TestOpiumProxyFactory", () => {
  let namedSigners: TNamedSigners
  let opiumProxyFactory: TestOpiumProxyFactory
  let derivative: TDerivative
  let secondDerivative: TDerivative

  before(async() => {
    namedSigners = await ethers.getNamedSigners() as TNamedSigners;
    const { optionCallMock } = await setup();
    
    derivative = derivativeFactory({
        margin: 30,
        endTime: ~~(Date.now() / 1000) + 3600, // now + 1 hour
        params: [200],
        syntheticId: optionCallMock.address,
    });

    secondDerivative = derivativeFactory({
        margin: 31,
        endTime: ~~(Date.now() / 1000) + 3601, // now + 1 hour
        params: [200],
        syntheticId: optionCallMock.address,
    });

    const OpiumProxyFactory = await ethers.getContractFactory("TestOpiumProxyFactory");
    opiumProxyFactory =<TestOpiumProxyFactory>await OpiumProxyFactory.deploy()
    await opiumProxyFactory.deployed()

    })
    
    it("expects _isContract to return false if the argument is an     external account", async () => {
        const { buyer } = namedSigners;
        const result  = await opiumProxyFactory._isContract(buyer.address)
        expect(result).to.not.be.true
    });

    it("expects _isContract to return true if the argument is a smart contract's address", async () => {
        const {core} = await setup()
        const result  = await opiumProxyFactory._isContract(core.address)
        expect(result).to.be.true
    });

    it("expects to mint the correct number of erc20 long/short positions", async () => {
        const { buyer, seller } = namedSigners;
        const quantity = 1

        const hash = getDerivativeHash(derivative)
        const tx = await opiumProxyFactory.mint(buyer.address, seller.address, hash, 1)

        await tx.wait()

        const result = await opiumProxyFactory.callStatic.mint(buyer.address, seller.address, hash, quantity)

        const longOpiumPositionToken = await <OpiumPositionToken> await ethers.getContractAt('OpiumPositionToken', result[0])
        const shortOpiumPositionToken = await <OpiumPositionToken> await ethers.getContractAt('OpiumPositionToken', result[1])

        const shortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address)
        const shortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address)

        const longOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address)
        const longOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address)

        expect(shortOpiumPositionTokenSellerBalance).to.equal(quantity)
        expect(shortOpiumPositionTokenBuyerBalance).to.equal(0)
        expect(longOpiumPositionTokenSellerBalance).to.equal(0)
        expect(longOpiumPositionTokenBuyerBalance).to.equal(quantity)
    });

    it("expects to burn the correct number of erc20 long/short positions with quantity set to 2", async () => {
        const { buyer, seller } = namedSigners;
        const quantity = 2

        const hash = getDerivativeHash(secondDerivative)
        const tx = await opiumProxyFactory.mint(buyer.address, seller.address, hash, quantity)

        await tx.wait()

        const result = await opiumProxyFactory.callStatic.mint(buyer.address, seller.address, hash, quantity)
        
        const longOpiumPositionToken = <OpiumPositionToken> await ethers.getContractAt('OpiumPositionToken', result[0])
        const shortOpiumPositionToken = <OpiumPositionToken> await ethers.getContractAt('OpiumPositionToken', result[1])
        

        const beforeShortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address)
        const beforeShortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address)
        const beforeLongOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address)
        const beforeLongOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address)

        expect(beforeShortOpiumPositionTokenSellerBalance).to.equal(quantity)
        expect(beforeShortOpiumPositionTokenBuyerBalance).to.equal(0)
        expect(beforeLongOpiumPositionTokenSellerBalance).to.equal(0)
        expect(beforeLongOpiumPositionTokenBuyerBalance).to.equal(quantity)

        const tx2 = await opiumProxyFactory.burn(seller.address, shortOpiumPositionToken.address, quantity)
        await tx2.wait()

        const afterShortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address)
        const afterShortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address)
        const afterLongOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address)
        const afterLongOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address)

        expect(afterShortOpiumPositionTokenSellerBalance).to.equal(0)
        expect(afterShortOpiumPositionTokenBuyerBalance).to.equal(0)
        expect(afterLongOpiumPositionTokenSellerBalance).to.equal(0)
        expect(afterLongOpiumPositionTokenBuyerBalance).to.equal(quantity)
    })

});
