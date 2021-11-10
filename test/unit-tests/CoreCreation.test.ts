// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import { decodeEvents, retrievePositionTokensAddresses } from "../../utils/events";
import { toBN } from "../../utils/bn";
import {
  computeTotalGrossPayout,
  createValidDerivativeExpiry,
  derivativeFactory,
  getDerivativeHash,
} from "../../utils/derivatives";
import setup from "./../__fixtures__";
// types
import { TNamedSigners } from "../../types";
import { Core, OpiumPositionToken } from "../../typechain";
import { pickError, semanticErrors } from "../../utils/constants";
import { resetNetwork } from "../../utils/evm";

describe("CoreCreation", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it(`should revert create OptionCall derivative with SYNTHETIC_AGGREGATOR:WRONG_MARGIN`, async () => {
    try {
      const { buyer, seller } = namedSigners;
      const { core, testToken, optionCallMock, tokenSpender } = await setup();

      const optionCall = derivativeFactory({
        margin: toBN("0"),
        endTime: await createValidDerivativeExpiry(3),
        params: [
          toBN("20000"), // Strike Price 200.00$
        ],
        token: testToken.address,
        syntheticId: optionCallMock.address,
      });
      const amount = toBN("3");
      await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
      await core.create(optionCall, amount, [buyer.address, seller.address]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.satisfy(() => {
        return (
          message.includes(pickError(semanticErrors.ERROR_SYNTHETIC_AGGREGATOR_WRONG_MARGIN)) ||
          message.includes(pickError(semanticErrors.ERROR_CORE_SYNTHETIC_VALIDATION_ERROR))
        );
      });
    }
  });

  it(`should revert create OptionCall derivative with CORE:SYNTHETIC_VALIDATION_ERROR`, async () => {
    const { buyer, seller } = namedSigners;
    const { core, testToken, optionCallMock, tokenSpender } = await setup();

    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: 0,
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const amount = toBN("3");
    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    await expect(core.create(optionCall, amount, [buyer.address, seller.address])).to.be.revertedWith(
      pickError(semanticErrors.ERROR_CORE_SYNTHETIC_VALIDATION_ERROR),
    );
  });

  it(`should revert create OptionCall derivative with 'CORE:NOT_ENOUGH_TOKEN_ALLOWANCE`, async () => {
    const { core, testToken, optionCallMock } = await setup();
    const { buyer, seller } = namedSigners;

    const optionCall = derivativeFactory({
      margin: toBN("3"),
      endTime: await createValidDerivativeExpiry(3),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const amount = 3;
    await expect(core.create(optionCall, amount, [buyer.address, seller.address])).to.be.revertedWith(
      pickError(semanticErrors.ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE),
    );
  });

  it(`should create OptionCall derivative`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const { deployer, buyer, seller, oracle } = namedSigners;

    const amount = toBN("3");
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(10),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const expectedDerivativeHash = getDerivativeHash(optionCall);

    const marginBalanceBefore = await testToken.balanceOf(deployer.address);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [buyer.address, seller.address]);
    const receipt = await tx.wait();

    const [longPositionAddress, shortPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);
    /**
     * emits _buyer, _seller, _derivativeHash, _amount
     */
    const [coreCreateEvent] = decodeEvents<Core>(core, "LogCreated", receipt.events);
    expect(coreCreateEvent[0]).to.equal(buyer.address);
    expect(coreCreateEvent[1]).to.equal(seller.address);
    expect(coreCreateEvent[2]).to.equal(expectedDerivativeHash);
    expect(coreCreateEvent[3]).to.equal(amount);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    const marginBalanceAfter = await testToken.balanceOf(deployer.address);
    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);

    expect(marginBalanceAfter).to.equal(marginBalanceBefore.sub(computeTotalGrossPayout(optionCall.margin, amount)));
    expect(buyerPositionsLongBalance).to.equal(amount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(amount);
  });

  it(`should deploy a LONG/SHORT erc20 position pair for a given option position without minting any position amount`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const { deployer, buyer, seller } = namedSigners;

    const amount = 0;
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(10),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const expectedDerivativeHash = getDerivativeHash(optionCall);

    const marginBalanceBefore = await testToken.balanceOf(deployer.address);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [buyer.address, seller.address]);
    const receipt = await tx.wait();

    const [shortPositionAddress, longPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    /**
     * emits _buyer, _seller, _derivativeHash, _amount
     */
    const [coreCreateEvent] = decodeEvents<Core>(core, "LogCreated", receipt.events);
    expect(coreCreateEvent[0]).to.equal(buyer.address);
    expect(coreCreateEvent[1]).to.equal(seller.address);
    expect(coreCreateEvent[2]).to.equal(expectedDerivativeHash);
    expect(coreCreateEvent[3]).to.equal(amount);

    const marginBalanceAfter = await testToken.balanceOf(deployer.address);
    expect(marginBalanceAfter).to.equal(marginBalanceBefore);

    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);

    expect(buyerPositionsLongBalance).to.equal(amount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(amount);
  });

  it("should not be able to deploy twice the same derivative's LONG/SHORT erc20 position pair", async () => {
    const { core, testToken, optionCallMock, tokenSpender } = await setup();
    const { deployer, buyer, seller } = namedSigners;

    const amount = toBN("3");
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(10),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [buyer.address, seller.address]);
    await tx.wait();
    await expect(core.create(optionCall, amount, [buyer.address, seller.address])).to.be.revertedWith(
      "ERC1167: create2 failed",
    );
  });

  it("should first create a LONG/SHORT position with 0 amount and then mint a specified amount for the previously deployed position pair", async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const { deployer, buyer, seller } = namedSigners;

    const creationAmount = 0;
    const mintAmount = toBN("3");
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(10),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    const expectedDerivativeHash = getDerivativeHash(optionCall);
    const marginBalanceBefore = await testToken.balanceOf(deployer.address);

    const tx = await core.create(optionCall, creationAmount, [buyer.address, seller.address]);
    const receipt = await tx.wait();

    /**
     * emits _buyer, _seller, _derivativeHash, _amount
     */
    const [coreCreateEvent] = decodeEvents<Core>(core, "LogCreated", receipt.events);
    expect(coreCreateEvent[0]).to.equal(buyer.address);
    expect(coreCreateEvent[1]).to.equal(seller.address);
    expect(coreCreateEvent[2]).to.equal(expectedDerivativeHash);
    expect(coreCreateEvent[3]).to.equal(creationAmount);

    const [longPositionAddress, shortPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);
    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );

    const marginBalanceAfter = await testToken.balanceOf(deployer.address);
    expect(marginBalanceAfter).to.equal(marginBalanceBefore);

    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);
    expect(buyerPositionsLongBalance).to.equal(creationAmount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(creationAmount);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(mintAmount));
    await core.mint(
      mintAmount,
      [longPositionERC20.address, shortPositionERC20.address],
      [buyer.address, seller.address],
    );

    const marginBalanceAfterMint = await testToken.balanceOf(deployer.address);
    expect(marginBalanceAfterMint).to.equal(
      marginBalanceBefore.sub(computeTotalGrossPayout(optionCall.margin, mintAmount)),
    );

    const buyerPositionsLongBalanceAfterMint = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalanceAfterMint = await shortPositionERC20.balanceOf(buyer.address);
    expect(buyerPositionsLongBalanceAfterMint, "wrong buyer mint amount").to.equal(mintAmount);
    expect(buyerPositionsShortBalanceAfterMint, "wrong buyer mint amount").to.equal(0);

    const sellerPositionsLongBalanceAfterMint = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalanceAfterMint = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalanceAfterMint, "wrong seller mint amount").to.equal(0);
    expect(sellerPositionsShortBalanceAfterMint, "wrong seller mint amount").to.equal(mintAmount);
  });

  it("should not be able to mint positions for a non-existent LONG/SHORT position pair", async () => {
    const { core, testToken, optionCallMock, tokenSpender } = await setup();
    const { deployer } = namedSigners;
    const amount = toBN("3");
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(10),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    await expect(
      core.mint(
        amount,
        ["0xb32ebff83243c7c676dba08e3688d81ad579ad35", "0x537cd27f9cb132ff613119f7b942959ad62a4f8c"],
        [deployer.address, deployer.address],
      ),
    ).to.be.revertedWith("Transaction reverted: function call to a non-contract account");
  });

  after(async () => {
    await resetNetwork();
  });
});
