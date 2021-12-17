// theirs
import { ethers } from "hardhat";
// utils
import { expect } from "../chai-setup";
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
import { Core, OpiumPositionToken } from "../../typechain";
import { resetNetwork } from "../../utils/evm";
import { redeemMany, redeemOne } from "../../utils/constants";

describe("Core: burn market neutral positions", () => {
  it(`should redeem an entire market neutral position and return the entire initial margin`, async () => {
    const {
      contracts: { core, testToken, tokenSpender, opiumProxyFactory, registry, optionCallMock },
      users: { deployer, redemptionReserveClaimer, author },
    } = await setup();
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
    const derivativeAuthorBalanceBefore = await core.getReservesVaultBalance(author.address, testToken.address);
    const protocolReserveClaimerBalanceBefore = await core.getReservesVaultBalance(
      redemptionReserveClaimer.address,
      testToken.address,
    );

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount).div(toBN("1")));
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

    expect(marketNeutralPartyLongBalance).to.be.equal(amount);
    expect(marketNeutralPartysShortBalance).to.be.equal(amount);

    const tx2 = await core[redeemOne]([longPositionAddress, shortPositionAddress], redeemAmount);
    const receipt2 = await tx2.wait();

    const [log] = await decodeEvents<Core>(core, "LogRedeemed", receipt2.events);

    /**
     * checks the emitted event arguments
     */
    expect(log._amount, "wrong amount event argument").to.be.eq(redeemAmount);
    expect(log._derivativeHash, "wrong derivativeHash event argument").to.be.eq(getDerivativeHash(optionCall));

    const marketNeutralPartyLongBalanceAfter = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalanceAfter = await shortPositionERC20.balanceOf(marketNeutralParty.address);

    const marketNeutralPartyBalanceAfterRedeem = await testToken.balanceOf(marketNeutralParty.address);

    // author fee (includes opium fee)
    const { derivativeAuthorRedemptionReservePart, protocolRedemptionReservePart } =
      await registry.getProtocolParameters();
    const marketNeutralPartyBalanceAfter = await testToken.balanceOf(marketNeutralParty.address);
    const derivativeAuthorBalanceAfter = await core.getReservesVaultBalance(author.address, testToken.address);
    const protocolReserveClaimerBalanceAfter = await core.getReservesVaultBalance(
      redemptionReserveClaimer.address,
      testToken.address,
    );

    const marketNeutralFees = computeFees(
      optionCall.margin.mul(redeemAmount).div(toBN("1")),
      derivativeAuthorRedemptionReservePart,
      protocolRedemptionReservePart,
    );
    expect(marketNeutralPartyBalanceAfterRedeem, "wrong redeemer balance").to.be.equal(
      marketNeutralBalanceAfterCreation.add(
        optionCall.margin.mul(redeemAmount).div(toBN("1")).sub(marketNeutralFees.totalFee),
      ),
    );

    expect(marketNeutralPartyLongBalanceAfter, "wrong long positions balance").to.be.equal(amount.sub(redeemAmount));
    expect(marketNeutralPartysShortBalanceAfter, "wrong short positions balance").to.be.equal(amount.sub(redeemAmount));
    expect(derivativeAuthorBalanceAfter, "wrong derivative author's redemption fee").to.be.equal(
      derivativeAuthorBalanceBefore.add(marketNeutralFees.authorFee),
    );
    expect(protocolReserveClaimerBalanceAfter, "wrong protocolReserveClaimerBalanceAfter's redemption fee").to.be.equal(
      protocolReserveClaimerBalanceBefore.add(marketNeutralFees.protocolFee),
    );
    console.log("marketNeutralPartyBalanceAfter ", marketNeutralPartyBalanceAfter.toString());
    console.log("marketNeutralPartyInitialBalance ", marketNeutralPartyInitialBalance.toString());
    console.log("marketNeutralFees ", marketNeutralFees.totalFee.toString());
    expect(
      marketNeutralPartyBalanceAfter,
      "wrong market neutral party's balance after successful redemption",
    ).to.be.equal(marketNeutralPartyInitialBalance.sub(marketNeutralFees.totalFee));
  });

  it(`should redeem a third of the initial position's margin and burn the corresponding SHORT/LONG tokens`, async () => {
    const {
      contracts: { core, testToken, tokenSpender, opiumProxyFactory, registry, optionCallMock },
      users: { deployer },
    } = await setup();
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

    expect(marketNeutralPartyLongBalance).to.be.equal(amount);
    expect(marketNeutralPartysShortBalance).to.be.equal(amount);

    const tx2 = await core[redeemOne]([longPositionAddress, shortPositionAddress], redeemAmount);
    const receipt2 = await tx2.wait();
    const [log] = await decodeEvents<Core>(core, "LogRedeemed", receipt2.events);
    /**
     * checks the emitted event arguments
     */
    expect(log._amount, "wrong amount event argument").to.be.eq(redeemAmount);
    expect(log._derivativeHash, "wrong derivativeHash event argument").to.be.eq(getDerivativeHash(optionCall));

    const marketNeutralPartyLongBalanceAfter = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalanceAfter = await shortPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartyBalanceAfterRedeem = await testToken.balanceOf(marketNeutralParty.address);

    const { derivativeAuthorRedemptionReservePart, protocolRedemptionReservePart } =
      await registry.getProtocolParameters();

    const marketNeutralFees = computeFees(
      optionCall.margin.mul(redeemAmount).div(toBN("1")),
      cast(derivativeAuthorRedemptionReservePart),
      protocolRedemptionReservePart,
    );
    expect(marketNeutralPartyBalanceAfterRedeem, "wrong redeemer balance").to.be.equal(
      marketNeutralBalanceAfterCreation.add(
        optionCall.margin.mul(redeemAmount).div(toBN("1")).sub(marketNeutralFees.totalFee),
      ),
    );
    expect(marketNeutralPartyLongBalanceAfter, "wrong long positions balance").to.be.equal(amount.sub(redeemAmount));
    expect(marketNeutralPartysShortBalanceAfter, "wrong short positions balance").to.be.equal(amount.sub(redeemAmount));
  });

  it(`should redeem many market neutral positions at once`, async () => {
    const {
      contracts: { core, testToken, tokenSpender, opiumProxyFactory, registry, optionCallMock },
      users: { deployer },
    } = await setup();

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
    expect(marketNeutralPartyLongBalance).to.be.equal(amount);
    expect(marketNeutralPartyShortBalance).to.be.equal(amount);
    expect(marketNeutralPartySecondLongBalance).to.be.equal(secondAmount);
    expect(marketNeutralPartySecondShortBalance).to.be.equal(secondAmount);

    const tx3 = await core[redeemMany](
      [
        [longPositionAddress, shortPositionAddress],
        [secondLongPositionAddress, secondShortPositionAddress],
      ],
      [redeemAmount, secondRedeemAmount],
    );
    const receipt3 = await tx3.wait();
    const [log1, log2] = await decodeEvents<Core>(core, "LogRedeemed", receipt3.events);
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
    const { derivativeAuthorRedemptionReservePart, protocolRedemptionReservePart } =
      await registry.getProtocolParameters();

    const firstOptionFees = computeFees(
      optionCall.margin.mul(redeemAmount).div(toBN("1")),
      cast(derivativeAuthorRedemptionReservePart),
      protocolRedemptionReservePart,
    );

    const secondOptionFees = computeFees(
      secondOptionCall.margin.mul(secondRedeemAmount).div(toBN("1")),
      cast(derivativeAuthorRedemptionReservePart),
      protocolRedemptionReservePart,
    );

    /**
     * expects the account's ERC20 balance after redeem is equal to the
     * ERC20 balance after creating the last redeemed position + all the redeemed collateral
     */
    expect(marketNeutralPartyBalanceAfterRedeem, "wrong redeemer balance").to.be.equal(
      marketNeutralPartyBalanceAfterSecondCreation
        .add(optionCall.margin.mul(redeemAmount).div(toBN("1")).sub(firstOptionFees.totalFee))
        .add(secondOptionCall.margin.mul(secondRedeemAmount).div(toBN("1")).sub(secondOptionFees.totalFee)),
    );
    /**
     * expects the amount of LONG/SHORT positions to be equal to the created amount - redeemed amount
     */
    expect(marketNeutralPartyLongBalanceAfter, "wrong first long position balance").to.be.equal(
      amount.sub(redeemAmount),
    );
    expect(marketNeutralPartysShortBalanceAfter, "wrong first short position balance").to.be.equal(
      amount.sub(redeemAmount),
    );
    expect(marketNeutralPartySecondLongBalanceAfter, "wrong second long position balance").to.be.equal(
      secondAmount.sub(secondRedeemAmount),
    );
    expect(marketNeutralPartySecondShortBalanceAfter, "wrong second long position balance").to.be.equal(
      secondAmount.sub(secondRedeemAmount),
    );
  });

  after(async () => {
    await resetNetwork();
  });
});
