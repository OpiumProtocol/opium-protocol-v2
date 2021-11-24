// theirs
import { ethers } from "hardhat";
// utils
import { expect } from "../chai-setup";
import {
  derivativeFactory,
  addPositionTokens,
  getDerivativeHash,
  computeTotalGrossPayout,
  computeFees,
  calculateTotalGrossPayout,
  EPayout,
  calculateTotalNetPayout,
} from "../../utils/derivatives";
import setup from "../__fixtures__";
import { toBN } from "../../utils/bn";
import {
  Core,
  OpiumPositionToken,
  OpiumProxyFactory,
  OptionCallSyntheticIdMock,
  OracleAggregator,
  Registry,
  TestToken,
  TokenSpender,
} from "../../typechain";
import { timeTravel } from "../../utils/evm";
import { TNamedSigners, ICreatedDerivativeOrder } from "../../types";
import { customDerivativeName, executeOne, SECONDS_40_MINS } from "../../utils/constants";
import { retrievePositionTokensAddresses } from "../../utils/events";

describe("Core with fractional quantities", () => {
  const endTime = ~~(Date.now() / 1000) + SECONDS_40_MINS; // Now + 40 mins
  let fullMarginOption: ICreatedDerivativeOrder,
    testToken: TestToken,
    testTokenSixDecimals: TestToken,
    core: Core,
    optionCallMock: OptionCallSyntheticIdMock,
    oracleAggregator: OracleAggregator,
    tokenSpender: TokenSpender,
    opiumProxyFactory: OpiumProxyFactory,
    registry: Registry;

  let namedSigners: TNamedSigners;

  before(async () => {
    ({
      core,
      testTokenSixDecimals,
      tokenSpender,
      oracleAggregator,
      opiumProxyFactory,
      optionCallMock,
      registry,
      testToken,
    } = await setup());

    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
    const { buyer, seller, oracle } = namedSigners;

    // Full margin option
    const fullMarginOptionDerivative = derivativeFactory({
      margin: ethers.utils.parseUnits("1.2", 18),
      endTime: ~~(Date.now() / 1000) + SECONDS_40_MINS, // Now + 40 mins
      params: [
        toBN("200"), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testTokenSixDecimals.address,
      syntheticId: optionCallMock.address,
    });

    const fullMarginOptionDerivativeHash = getDerivativeHash(fullMarginOptionDerivative);
    const fullMarginOptionPayload = {
      derivative: fullMarginOptionDerivative,
      amount: toBN("0.3"),
      price: toBN("230"), // full margin profit
      hash: fullMarginOptionDerivativeHash,
    };
    console.log("fullMarginOptionPayload", fullMarginOptionPayload);
    await oracleAggregator
      .connect(oracle)
      .__callback(fullMarginOptionPayload.derivative.endTime, fullMarginOptionPayload.price); // Current price

    await testTokenSixDecimals.approve(
      tokenSpender.address,
      fullMarginOptionPayload.derivative.margin.mul(fullMarginOptionPayload.amount),
    );

    const tx = await core.create(
      fullMarginOptionPayload.derivative,
      fullMarginOptionPayload.amount,
      [buyer.address, seller.address],
      customDerivativeName,
    );
    const receipt = await tx.wait();

    fullMarginOption = addPositionTokens(
      fullMarginOptionPayload,
      ...retrievePositionTokensAddresses(opiumProxyFactory, receipt),
    );
  });

  it(`should create OptionCall derivative`, async () => {
    const { deployer, buyer, seller } = namedSigners;

    const amount = toBN("0.2");
    const optionCall = derivativeFactory({
      margin: toBN("0.03"),
      endTime,
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });

    const marginBalanceBefore = await testToken.balanceOf(deployer.address);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [buyer.address, seller.address], customDerivativeName);
    const receipt = await tx.wait();

    const [longPositionAddress, shortPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);
    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );

    const marginBalanceAfter = await testToken.balanceOf(deployer.address);
    expect(marginBalanceAfter).to.equal(marginBalanceBefore.sub(computeTotalGrossPayout(optionCall.margin, amount)));

    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);

    expect(buyerPositionsLongBalance).to.equal(amount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(amount);
  });

  it("should execute full margin option", async () => {
    const { deployer, buyer, seller, author } = namedSigners;

    await timeTravel(SECONDS_40_MINS);
    const buyerBalanceBefore = await testTokenSixDecimals.balanceOf(buyer.address);

    const sellerBalanceBefore = await testTokenSixDecimals.balanceOf(seller.address);
    const opiumFeesBefore = await core.getReservesVaultBalance(deployer.address, testTokenSixDecimals.address);
    const authorFeesBefore = await core.getReservesVaultBalance(author.address, testTokenSixDecimals.address);

    await core.connect(buyer)[executeOne](fullMarginOption.longPositionAddress, fullMarginOption.amount);
    await core.connect(seller)[executeOne](fullMarginOption.shortPositionAddress, fullMarginOption.amount);

    const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } = await optionCallMock.getExecutionPayout(
      fullMarginOption.derivative,
      fullMarginOption.price,
    );

    const { buyerMargin, sellerMargin } = await optionCallMock.getMargin(fullMarginOption.derivative);

    const authorFeeCommission = await optionCallMock.getAuthorCommission();

    const { protocolExecutionReservePart } = await registry.getProtocolParameters();

    const buyerFees = computeFees(
      calculateTotalGrossPayout(
        buyerMargin,
        sellerMargin,
        buyerPayoutRatio,
        sellerPayoutRatio,
        fullMarginOption.amount,
        EPayout.BUYER,
      ),
      authorFeeCommission,
      protocolExecutionReservePart,
    );
    const sellerFees = computeFees(
      calculateTotalGrossPayout(
        buyerMargin,
        sellerMargin,
        buyerPayoutRatio,
        sellerPayoutRatio,
        fullMarginOption.amount,
        EPayout.SELLER,
      ),
      authorFeeCommission,
      protocolExecutionReservePart,
    );

    const buyerNetPayout = calculateTotalNetPayout(
      buyerMargin,
      sellerMargin,
      buyerPayoutRatio,
      sellerPayoutRatio,
      fullMarginOption.amount,
      buyerFees.totalFee,
      EPayout.BUYER,
    );
    const sellerNetPayout = calculateTotalNetPayout(
      buyerMargin,
      sellerMargin,
      buyerPayoutRatio,
      sellerPayoutRatio,
      fullMarginOption.amount,
      sellerFees.totalFee,
      EPayout.SELLER,
    );

    const buyerBalanceAfter = await testTokenSixDecimals.balanceOf(buyer.address);
    expect(buyerBalanceAfter, "wrong buyer balance").to.be.equal(buyerBalanceBefore.add(buyerNetPayout));

    const sellerBalanceAfter = await testTokenSixDecimals.balanceOf(seller.address);
    expect(sellerBalanceAfter, "wrong seller balance").to.be.equal(sellerBalanceBefore.add(sellerNetPayout));

    const opiumFeesAfter = await core.getReservesVaultBalance(deployer.address, testTokenSixDecimals.address);
    expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(
      opiumFeesBefore.add(buyerFees.protocolFee).add(sellerFees.protocolFee),
    );

    const authorFeesAfter = await core.getReservesVaultBalance(author.address, testTokenSixDecimals.address);
    expect(authorFeesAfter, "wrong author fee").to.be.equal(
      authorFeesBefore.add(buyerFees.authorFee).add(sellerFees.authorFee),
    );
  });
});