// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import { derivativeFactory } from "../utils/derivatives";
import setup from "../utils/setup";
import { decodeLogs } from "../utils/events";
import { cast } from "../utils/bn";
import { formatAddress } from "../utils/addresses";
// types and constants
import { TNamedSigners } from "../types";
import { OpiumPositionToken, OpiumProxyFactory } from "../typechain";
import { SECONDS_40_MINS } from "../utils/constants";

describe("Core: burn market neutral positions", () => {
  const endTime = ~~(Date.now() / 1000) + SECONDS_40_MINS; // Now + 40 mins
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });

  it(`should burn a single market neutral position and return the initial margin`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const { deployer } = namedSigners;
    const marketNeutralParty = deployer;

    const amount = 3;
    const optionCall = derivativeFactory({
      margin: cast(30),
      endTime,
      params: [
        cast(20000), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    const initialTokenBalance = await testToken.balanceOf(marketNeutralParty.address);
    console.log(`initialTokenBalance: ${initialTokenBalance.toString()}`);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [marketNeutralParty.address, marketNeutralParty.address]);
    const receipt = await tx.wait();
    const log = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, "LogPositionTokenAddress", receipt);
    const shortPositionAddress = formatAddress(log[0].data);
    const longPositionAddress = formatAddress(log[1].data);

    const tokenBalanceAfterCreation = await testToken.balanceOf(marketNeutralParty.address);
    console.log(`tokenBalanceAfterCreation: ${tokenBalanceAfterCreation.toString()}`);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    const marketNeutralPartyLongBalance = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalance = await shortPositionERC20.balanceOf(marketNeutralParty.address);

    expect(marketNeutralPartyLongBalance).to.equal(amount);
    expect(marketNeutralPartysShortBalance).to.equal(amount);

    const tx2 = await core["burnMarketNeutral(address[2],(uint256,uint256,uint256[],address,address,address))"](
      [shortPositionAddress, longPositionAddress],
      optionCall,
    );
    await tx2.wait();

    const marketNeutralPartyLongBalanceAfter = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalanceAfter = await shortPositionERC20.balanceOf(marketNeutralParty.address);

    const tokenBalanceAfterBurn = await testToken.balanceOf(marketNeutralParty.address);
    console.log(`tokenBalanceAfterBurn: ${tokenBalanceAfterBurn.toString()}`);

    expect(tokenBalanceAfterBurn).to.equal(initialTokenBalance);
    expect(marketNeutralPartyLongBalanceAfter).to.equal(0);
    expect(marketNeutralPartysShortBalanceAfter).to.equal(0);
  });

  it(`should burn all the market neutral positions of the caller and return all their margins`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const { deployer } = namedSigners;

    const marketNeutralParty = deployer;

    // creation of the first market neutral position

    const initialTokenBalance = await testToken.balanceOf(marketNeutralParty.address);
    console.log(`initial token balance: ${initialTokenBalance.toString()}`);

    const amount = 12;
    const optionCall = derivativeFactory({
      margin: cast(400000),
      endTime,
      params: [
        cast(20000), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [marketNeutralParty.address, marketNeutralParty.address]);
    const receipt = await tx.wait();
    const log = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, "LogPositionTokenAddress", receipt);
    const shortPositionAddress = formatAddress(log[0].data);
    const longPositionAddress = formatAddress(log[1].data);

    // creation of the second market neutral position

    const secondAmount = 7;
    const secondOptionCall = derivativeFactory({
      margin: cast(1231900100),
      endTime,
      params: [
        cast(20000), // Strike Price 200.00$
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
    const log2 = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, "LogPositionTokenAddress", receipt2);
    const secondShortPositionAddress = formatAddress(log2[0].data);
    const secondLongPositionAddress = formatAddress(log2[1].data);

    const tokenBalanceAfterSecondCreation = await testToken.balanceOf(marketNeutralParty.address);
    console.log(`token balance after second derivative creation: ${tokenBalanceAfterSecondCreation.toString()}`);

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

    expect(marketNeutralPartyLongBalance).to.equal(amount);
    expect(marketNeutralPartyShortBalance).to.equal(amount);
    expect(marketNeutralPartySecondLongBalance).to.equal(secondAmount);
    expect(marketNeutralPartySecondShortBalance).to.equal(secondAmount);

    //@ts-ignore
    const tx3 = await core["burnMarketNeutral(address[2][],(uint256,uint256,uint256[],address,address,address)[])"](
      [
        [shortPositionAddress, longPositionAddress],
        [secondShortPositionAddress, secondLongPositionAddress],
      ],
      [optionCall, secondOptionCall],
    );
    await tx3.wait();

    const marketNeutralPartyLongBalanceAfter = await longPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartysShortBalanceAfter = await shortPositionERC20.balanceOf(marketNeutralParty.address);
    const marketNeutralPartySecondLongBalanceAfter = await secondLongPositionERC20.balanceOf(
      marketNeutralParty.address,
    );
    const marketNeutralPartySecondShortBalanceAfter = await secondShortPositionERC20.balanceOf(
      marketNeutralParty.address,
    );

    const tokenBalanceAfterBurn = await testToken.balanceOf(marketNeutralParty.address);
    console.log(
      `token balance after all market neutral positions have been burnt: ${tokenBalanceAfterBurn.toString()}`,
    );

    expect(tokenBalanceAfterBurn).to.equal(initialTokenBalance);
    expect(marketNeutralPartyLongBalanceAfter).to.equal(0);
    expect(marketNeutralPartysShortBalanceAfter).to.equal(0);
    expect(marketNeutralPartySecondLongBalanceAfter).to.equal(0);
    expect(marketNeutralPartySecondShortBalanceAfter).to.equal(0);
  });
});
