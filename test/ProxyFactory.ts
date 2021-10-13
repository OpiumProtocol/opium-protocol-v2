// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import { toBN } from "../utils/bn";
import { derivativeFactory, getDerivativeHash } from "../utils/derivatives";
import setup from "../utils/setup";
// types and constants
import { TNamedSigners } from "../types";
import { Core, OpiumPositionToken, OpiumProxyFactory, OptionCallSyntheticIdMock } from "../typechain";
import { TDerivative } from "../types";
import { retrievePositionTokensAddresses } from "../utils/events";
import { impersonateAccount, setBalance } from "../utils/timeTravel";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

describe("OpiumProxyFactory", () => {
  let namedSigners: TNamedSigners;
  let coreImpersonator: SignerWithAddress;
  let opiumProxyFactory: OpiumProxyFactory;
  let optionCallMock: OptionCallSyntheticIdMock;
  let core: Core;
  let derivative: TDerivative;
  let secondDerivative: TDerivative;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
    ({ optionCallMock, opiumProxyFactory, core } = await setup());

    derivative = derivativeFactory({
      margin: toBN("30"),
      endTime: 1632915687, //Tue Sep 29 2026 09:41:17 GMT+0000
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });

    secondDerivative = derivativeFactory({
      margin: toBN("31"),
      endTime: ~~(Date.now() / 1000) + 3601, // now + 1 hour
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });

    /**
     * impersonating core with hardhat evm methods
     */
    coreImpersonator = await impersonateAccount(core.address);
    await setBalance(coreImpersonator.address, toBN("2"));
  });

  it("expects to revert if caller is not core", async () => {
    try {
      const { buyer, seller } = namedSigners;
      await impersonateAccount(core.address);
      const amount = 1;

      const hash = getDerivativeHash(derivative);
      await opiumProxyFactory.mint(buyer.address, seller.address, hash, derivative, amount);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("USING_REGISTRY:ONLY_CORE_ALLOWED");
    }
  });

  it("expects to mint the correct number of erc20 long/short positions", async () => {
    const { buyer, seller } = namedSigners;
    const amount = 1;

    const hash = getDerivativeHash(derivative);
    const tx = await opiumProxyFactory
      .connect(coreImpersonator)
      .mint(buyer.address, seller.address, hash, derivative, amount);
    const receipt = await tx.wait();

    const [shortOpiumPositionTokenAddress, longOpiumPositionTokenAddress] = retrievePositionTokensAddresses(
      opiumProxyFactory,
      receipt,
    );

    const longOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", longOpiumPositionTokenAddress)
    ));
    const shortOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortOpiumPositionTokenAddress)
    ));

    const shortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address);
    const shortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address);

    const longOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address);
    const longOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address);

    expect(shortOpiumPositionTokenSellerBalance).to.equal(amount);
    expect(shortOpiumPositionTokenBuyerBalance).to.equal(0);
    expect(longOpiumPositionTokenSellerBalance).to.equal(0);
    expect(longOpiumPositionTokenBuyerBalance).to.equal(amount);

    const longTokenSupply = await longOpiumPositionToken.totalSupply();
    const shortTokenSupply = await shortOpiumPositionToken.totalSupply();
    const longTokenName = await longOpiumPositionToken.name();
    const shortTokenName = await shortOpiumPositionToken.name();
    const longTokenSymbol = await longOpiumPositionToken.symbol();
    const shortTokenSymbol = await shortOpiumPositionToken.symbol();

    expect(longTokenName).to.be.eq("OPIUM LONG TOKEN");
    expect(shortTokenName).to.be.eq("OPIUM SHORT TOKEN");
    expect(longTokenSymbol).to.be.eq("OPLN");
    expect(shortTokenSymbol).to.be.eq("OPSH");
    expect(longTokenSupply).to.be.eq(amount);
    expect(shortTokenSupply).to.be.eq(amount);
  });

  it("expects to burn the correct number of erc20 long/short positions with amount set to 2", async () => {
    const { buyer, seller } = namedSigners;
    const amount = 2;

    const hash = getDerivativeHash(secondDerivative);
    const tx = await opiumProxyFactory
      .connect(coreImpersonator)
      .mint(buyer.address, seller.address, hash, secondDerivative, amount);
    const receipt = await tx.wait();

    const [shortOpiumPositionTokenAddress, longOpiumPositionTokenAddress] = retrievePositionTokensAddresses(
      opiumProxyFactory,
      receipt,
    );

    const longOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", longOpiumPositionTokenAddress)
    ));
    const shortOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortOpiumPositionTokenAddress)
    ));

    const beforeShortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address);
    const beforeShortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address);
    const beforeLongOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address);
    const beforeLongOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address);

    expect(beforeShortOpiumPositionTokenSellerBalance).to.equal(amount);
    expect(beforeShortOpiumPositionTokenBuyerBalance).to.equal(0);
    expect(beforeLongOpiumPositionTokenSellerBalance).to.equal(0);
    expect(beforeLongOpiumPositionTokenBuyerBalance).to.equal(amount);

    const tx2 = await opiumProxyFactory
      .connect(coreImpersonator)
      .burn(seller.address, shortOpiumPositionToken.address, amount);
    await tx2.wait();

    const afterShortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address);
    const afterShortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address);
    const afterLongOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address);
    const afterLongOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address);

    expect(afterShortOpiumPositionTokenSellerBalance).to.equal(0);
    expect(afterShortOpiumPositionTokenBuyerBalance).to.equal(0);
    expect(afterLongOpiumPositionTokenSellerBalance).to.equal(0);
    expect(afterLongOpiumPositionTokenBuyerBalance).to.equal(amount);
  });
});
