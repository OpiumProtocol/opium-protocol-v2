import { ethers } from "hardhat";
import { utils } from "ethers";
import { expect } from "chai";
import { derivativeFactory } from "../utils/derivatives";
import { calculateLongTokenId, calculateShortTokenId } from "../utils/positions";
import setup from "../utils/setup";
import { TNamedSigners } from "../hardhat.config";
import { ERC20, OpiumPositionToken, OpiumProxyFactory } from "../typechain";
import { decodeLogs } from "../utils/events";

const SECONDS_40_MINS = 60 * 40;

const formatAddress = (address: string): string => {
  return '0x'.concat(address.split('0x000000000000000000000000')[1])
}
describe("CoreCreation", () => {
  let hash;
  const endTime = ~~(Date.now() / 1000) + SECONDS_40_MINS; // Now + 40 mins
  let namedSigners: TNamedSigners

  before(async() => {
    namedSigners = await ethers.getNamedSigners() as TNamedSigners;
  })
  it(`should return the correct getDerivativeHash`, async () => {
    const { core, testToken, optionCallMock } = await setup();
    const optionCall = derivativeFactory({
      margin: 30,
      endTime,
      params: [
        20000, // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const hash = await core.getDerivativeHash(optionCall);
    const expectedHash = utils.solidityKeccak256(
      ["uint256", "uint256", "uint256[]", "address", "address", "address"],
      Object.values(optionCall),
    );

    expect(hash).to.not.be.empty;
    expect(hash).to.be.equal(expectedHash);
  });

  it(`should revert create OptionCall derivative with SYNTHETIC_AGGREGATOR:WRONG_MARGIN`, async () => {
    try {
      const { deployer, buyer, seller } = namedSigners;
      const { core, testToken, optionCallMock, tokenSpender } = await setup();

      const optionCall = derivativeFactory({
        margin: 0,
        endTime,
        params: [
          20000, // Strike Price 200.00$
        ],
        token: testToken.address,
        syntheticId: optionCallMock.address,
      });
      const quantity = 3;
      await testToken.approve(tokenSpender.address, optionCall.margin * quantity, { from: deployer.address });
      await core.create(optionCall, quantity, [buyer.address, seller.address], { from: deployer.address });
    } catch (error) {
      expect(error.message).to.include("SYNTHETIC_AGGREGATOR:WRONG_MARGIN");
    }
  });

  it(`should revert create OptionCall derivative with CORE:SYNTHETIC_VALIDATION_ERROR`, async () => {
    try {
      const { deployer, buyer, seller } = namedSigners;  
      const { core, testToken, optionCallMock, tokenSpender } = await setup();

      const optionCall = derivativeFactory({
        margin: 30,
        endTime: 0,
        params: [
          20000, // Strike Price 200.00$
        ],
        token: testToken.address,
        syntheticId: optionCallMock.address,
      });
      const quantity = 3;
      await testToken.approve(tokenSpender.address, optionCall.margin * quantity, { from: deployer.address });
      await core.create(optionCall, quantity, [buyer.address, seller.address], { from: deployer.address });
    } catch (error) {
      expect(error.message).to.include("CORE:SYNTHETIC_VALIDATION_ERROR");
    }
  });

  it(`should revert create OptionCall derivative with 'CORE:NOT_ENOUGH_TOKEN_ALLOWANCE`, async () => {
    try {
      const { core, testToken, optionCallMock } = await setup();
      const { deployer, buyer, seller } = namedSigners;  

      const optionCall = derivativeFactory({
        margin: 3,
        endTime,
        params: [
          20000, // Strike Price 200.00$
        ],
        token: testToken.address,
        syntheticId: optionCallMock.address,
      });
      const quantity = 3;
      await core.create(optionCall, quantity, [buyer.address, seller.address], { from: deployer.address });
    } catch (error) {
      expect(error.message).to.include("CORE:NOT_ENOUGH_TOKEN_ALLOWANCE");
    }
  });

  it(`should create OptionCall derivative`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const { deployer, buyer, seller } = namedSigners;

    const quantity = 3;
    const optionCall = derivativeFactory({
      margin: 30,
      endTime,
      params: [
        20000, // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    hash = await core.getDerivativeHash(optionCall);

    const balance = await testToken.balanceOf(deployer.address, { from: deployer.address });

    await testToken.approve(tokenSpender.address, optionCall.margin * quantity, { from: deployer.address });
    const tx = await core.create(optionCall, quantity, [buyer.address, seller.address], { from: deployer.address });
    const receipt = await tx.wait()
    const log = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, 'LogPositionTokenAddress', receipt)
    const shortPositionAddress = formatAddress(log[0].data)
    const longPositionAddress = formatAddress(log[1].data)

    const shortPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress)

    // const buyerPositionsBalance = await tokenMinter["balanceOf(address)"](buyer.address);
    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address)
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address)

    // expect(buyerPositionsBalance).to.equal(1);
    expect(buyerPositionsLongBalance).to.equal(quantity);
    expect(buyerPositionsShortBalance).to.equal(0);

    // const sellerPositionsBalance = await tokenMinter["balanceOf(address)"](seller.address);
    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address)
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address)

    // expect(sellerPositionsBalance).to.equal(1);
    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(quantity);
  });

  it("should create second exactly the same OptionCall derivative", async () => {
    const { buyer, seller } = namedSigners;

    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const quantity = 3;
    const optionCall = derivativeFactory({
      margin: 30,
      endTime,
      params: [
        20000, // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, optionCall.margin * quantity);

    hash = await core.getDerivativeHash(optionCall);

    const oldCoreTokenBalance = await testToken.balanceOf(core.address);

    // Create derivative
    const tx = await core.create(optionCall, quantity, [buyer.address, seller.address]);
    const receipt = await tx.wait()
    const log = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, 'LogPositionTokenAddress', receipt)
    const shortPositionAddress = formatAddress(log[0].data)
    const longPositionAddress = formatAddress(log[1].data)

    const shortPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress)

    const newCoreTokenBalance = await testToken.balanceOf(core.address);

    expect(newCoreTokenBalance).to.equal(oldCoreTokenBalance.toNumber() + optionCall.margin * quantity);

    // const buyerPositionsBalance = await tokenMinter["balanceOf(address)"](buyer.address);
    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address)
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address)

    // expect(buyerPositionsBalance).to.equal(1);
    expect(buyerPositionsLongBalance).to.equal(quantity);
    expect(buyerPositionsShortBalance).to.equal(0);

    // const sellerPositionsBalance = await tokenMinter["balanceOf(address)"](seller.address);
    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address)
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address)

    // expect(sellerPositionsBalance).to.equal(1);
    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(quantity);
  });
});
