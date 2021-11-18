// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import {
  computeFees,
  createValidDerivativeExpiry,
  derivativeFactory,
  getDerivativeHash,
} from "../../utils/derivatives";
import setup from "../__fixtures__";
import { decodeEvents, retrievePositionTokensAddresses } from "../../utils/events";
import { cast, toBN } from "../../utils/bn";
// types and constants
import { TNamedSigners } from "../../types";
import { Core, OpiumPositionToken } from "../../typechain";
import { resetNetwork } from "../../utils/evm";

const redeemOne = "redeem(address[2],uint256)";
const redeemMany = "redeem(address[2][],uint256[])";

describe("Core: burn market neutral positions", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it(`should redeem an entire market neutral position and return the entire initial margin`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry } = await setup();
    const { deployer } = namedSigners;
    const marketNeutralParty = deployer;

    const amount = toBN("3");
    const redeemAmount = amount;
    const optionCall = derivativeFactory({
      margin: toBN("20"),
      endTime: await createValidDerivativeExpiry(2),
      params: [
        toBN("20000"), // Strike Price
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    const marketNeutralPartyInitialBalance = await testToken.balanceOf(marketNeutralParty.address);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [marketNeutralParty.address, marketNeutralParty.address]);
    const receipt = await tx.wait();
    const [longPositionAddress, shortPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    const marketNeutralBalanceAfterCreation = await testToken.balanceOf(marketNeutralParty.address);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    const marketNeutralPartyLongBalance = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalance = await shortPositionERC20.balanceOf(marketNeutralParty.address);

    expect(marketNeutralPartyLongBalance).to.equal(amount);
    expect(marketNeutralPartysShortBalance).to.equal(amount);

    const tx2 = await core["redeem(address[2],uint256)"]([longPositionAddress, shortPositionAddress], redeemAmount);
    const receipt2 = await tx2.wait();

    const [log] = await decodeEvents<Core>(core, "LogRedeem", receipt2.events);

    /**
     * checks the emitted event arguments
     */
    expect(log._amount, "wrong amount event argument").to.be.eq(redeemAmount);
    expect(log._derivativeHash, "wrong derivativeHash event argument").to.be.eq(getDerivativeHash(optionCall));

    const marketNeutralPartyLongBalanceAfter = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalanceAfter = await shortPositionERC20.balanceOf(marketNeutralParty.address);

    const marketNeutralPartyBalanceAfterRedeem = await testToken.balanceOf(marketNeutralParty.address);

    // author fee (includes opium fee)
    const { derivativeAuthorRedemptionFee, protocolCommissionPart } = await registry.getProtocolParameters();
    const authorFeeCommission = await optionCallMock.getAuthorCommission();

    const marketNeutralFees = computeFees(
      optionCall.margin.mul(redeemAmount).div(toBN("1")),
      cast(derivativeAuthorRedemptionFee),
      protocolCommissionPart,
    );
    expect(marketNeutralPartyBalanceAfterRedeem, "wrong redeemer balance").to.equal(
      marketNeutralBalanceAfterCreation.add(
        optionCall.margin.mul(redeemAmount).div(toBN("1")).sub(marketNeutralFees.totalFee),
      ),
    );
    expect(marketNeutralPartyLongBalanceAfter, "wrong long positions balance").to.equal(amount.sub(redeemAmount));
    expect(marketNeutralPartysShortBalanceAfter, "wrong short positions balance").to.equal(amount.sub(redeemAmount));
  });

  it(`should redeem a third of the initial position's margin and burn the corresponding SHORT/LONG tokens`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry } = await setup();
    const { deployer } = namedSigners;
    const marketNeutralParty = deployer;

    const amount = toBN("9");
    const redeemAmount = toBN("4");
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(2),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [marketNeutralParty.address, marketNeutralParty.address]);
    const receipt = await tx.wait();
    const [longPositionAddress, shortPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    const marketNeutralBalanceAfterCreation = await testToken.balanceOf(marketNeutralParty.address);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    const marketNeutralPartyLongBalance = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalance = await shortPositionERC20.balanceOf(marketNeutralParty.address);

    expect(marketNeutralPartyLongBalance).to.equal(amount);
    expect(marketNeutralPartysShortBalance).to.equal(amount);

    const tx2 = await core[redeemOne]([longPositionAddress, shortPositionAddress], redeemAmount);
    const receipt2 = await tx2.wait();
    const [log] = await decodeEvents<Core>(core, "LogRedeem", receipt2.events);
    /**
     * checks the emitted event arguments
     */
    expect(log._amount, "wrong amount event argument").to.be.eq(redeemAmount);
    expect(log._derivativeHash, "wrong derivativeHash event argument").to.be.eq(getDerivativeHash(optionCall));

    const marketNeutralPartyLongBalanceAfter = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalanceAfter = await shortPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartyBalanceAfterRedeem = await testToken.balanceOf(marketNeutralParty.address);

    const { derivativeAuthorRedemptionFee, protocolCommissionPart } = await registry.getProtocolParameters();

    const marketNeutralFees = computeFees(
      optionCall.margin.mul(redeemAmount).div(toBN("1")),
      cast(derivativeAuthorRedemptionFee),
      protocolCommissionPart,
    );
    expect(marketNeutralPartyBalanceAfterRedeem, "wrong redeemer balance").to.equal(
      marketNeutralBalanceAfterCreation.add(
        optionCall.margin.mul(redeemAmount).div(toBN("1")).sub(marketNeutralFees.totalFee),
      ),
    );
    expect(marketNeutralPartyLongBalanceAfter, "wrong long positions balance").to.equal(amount.sub(redeemAmount));
    expect(marketNeutralPartysShortBalanceAfter, "wrong short positions balance").to.equal(amount.sub(redeemAmount));
  });

  it(`should redeem many market neutral positions at once`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry } = await setup();
    const { deployer } = namedSigners;

    const marketNeutralParty = deployer;

    // creation of the first market neutral position
    const amount = toBN("12");
    const redeemAmount = amount;
    const optionCall = derivativeFactory({
      margin: toBN("90"),
      endTime: await createValidDerivativeExpiry(2),
      params: [
        toBN("30000"), // Strike Price
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [marketNeutralParty.address, marketNeutralParty.address]);
    const receipt = await tx.wait();
    const [longPositionAddress, shortPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    // creation of the second market neutral position

    const secondAmount = toBN("7");
    const secondRedeemAmount = toBN("3");
    const secondOptionCall = derivativeFactory({
      margin: toBN("123"),
      endTime: await createValidDerivativeExpiry(4),
      params: [
        toBN("10000"), // Strike Price
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, secondOptionCall.margin.mul(secondAmount));
    const tx2 = await core.create(secondOptionCall, secondAmount, [
      marketNeutralParty.address,
      marketNeutralParty.address,
    ]);
    const receipt2 = await tx2.wait();
    const [secondLongPositionAddress, secondShortPositionAddress] = retrievePositionTokensAddresses(
      opiumProxyFactory,
      receipt2,
    );

    const marketNeutralPartyBalanceAfterSecondCreation = await testToken.balanceOf(marketNeutralParty.address);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);
    const secondShortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", secondShortPositionAddress)
    );
    const secondLongPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", secondLongPositionAddress)
    );

    const marketNeutralPartyLongBalance = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartyShortBalance = await shortPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartySecondLongBalance = await secondLongPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartySecondShortBalance = await secondShortPositionERC20.balanceOf(marketNeutralParty.address);

    /**
     * expects the amount of minted LONG/SHORT after creation positions is as expected
     */
    expect(marketNeutralPartyLongBalance).to.equal(amount);
    expect(marketNeutralPartyShortBalance).to.equal(amount);
    expect(marketNeutralPartySecondLongBalance).to.equal(secondAmount);
    expect(marketNeutralPartySecondShortBalance).to.equal(secondAmount);

    const tx3 = await core[redeemMany](
      [
        [longPositionAddress, shortPositionAddress],
        [secondLongPositionAddress, secondShortPositionAddress],
      ],
      [redeemAmount, secondRedeemAmount],
    );
    const receipt3 = await tx3.wait();
    const [log1, log2] = await decodeEvents<Core>(core, "LogRedeem", receipt3.events);
    /**
     * checks the emitted event arguments
     */
    expect(log1._amount, "wrong amount event argument").to.be.eq(redeemAmount);
    expect(log1._derivativeHash, "wrong derivativeHash event argument").to.be.eq(getDerivativeHash(optionCall));
    expect(log2._amount, "wrong amount event argument").to.be.eq(secondRedeemAmount);
    expect(log2._derivativeHash, "wrong derivativeHash event argument").to.be.eq(getDerivativeHash(secondOptionCall));

    const marketNeutralPartyLongBalanceAfter = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalanceAfter = await shortPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartySecondLongBalanceAfter = await secondLongPositionERC20.balanceOf(
      marketNeutralParty.address,
    );
    const marketNeutralPartySecondShortBalanceAfter = await secondShortPositionERC20.balanceOf(
      marketNeutralParty.address,
    );
    const marketNeutralPartyBalanceAfterRedeem = await testToken.balanceOf(marketNeutralParty.address);

    // author fee (includes opium fee)
    const { derivativeAuthorRedemptionFee, protocolCommissionPart } = await registry.getProtocolParameters();

    const firstOptionFees = computeFees(
      optionCall.margin.mul(redeemAmount).div(toBN("1")),
      cast(derivativeAuthorRedemptionFee),
      protocolCommissionPart,
    );

    const secondOptionFees = computeFees(
      secondOptionCall.margin.mul(secondRedeemAmount).div(toBN("1")),
      cast(derivativeAuthorRedemptionFee),
      protocolCommissionPart,
    );

    /**
     * expects the account's ERC20 balance after redeem is equal to the
     * ERC20 balance after creating the last redeemed position + all the redeemed collateral
     */
    expect(marketNeutralPartyBalanceAfterRedeem, "wrong redeemer balance").to.equal(
      marketNeutralPartyBalanceAfterSecondCreation
        .add(optionCall.margin.mul(redeemAmount).div(toBN("1")).sub(firstOptionFees.totalFee))
        .add(secondOptionCall.margin.mul(secondRedeemAmount).div(toBN("1")).sub(secondOptionFees.totalFee)),
    );
    /**
     * expects the amount of LONG/SHORT positions to be equal to the created amount - redeemed amount
     */
    expect(marketNeutralPartyLongBalanceAfter, "wrong first long position balance").to.equal(amount.sub(redeemAmount));
    expect(marketNeutralPartysShortBalanceAfter, "wrong first short position balance").to.equal(
      amount.sub(redeemAmount),
    );
    expect(marketNeutralPartySecondLongBalanceAfter, "wrong second long position balance").to.equal(
      secondAmount.sub(secondRedeemAmount),
    );
    expect(marketNeutralPartySecondShortBalanceAfter, "wrong second long position balance").to.equal(
      secondAmount.sub(secondRedeemAmount),
    );
  });

  after(async () => {
    await resetNetwork();
  });
});
