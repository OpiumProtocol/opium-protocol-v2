// theirs
import { ethers } from "hardhat";
// utils
import { expect } from "../../chai-setup";
import { cast, mulWithPrecisionFactor, toBN } from "../../../utils/bn";
import {
  calculateTotalGrossPayout,
  calculateTotalNetPayout,
  computeFees,
  createValidDerivativeExpiry,
  derivativeFactory,
  EPayout,
} from "../../../utils/derivatives";
import setup from "../../__fixtures__";
// types and constants
import { TNamedSigners } from "../../../types";
import {
  OpiumPositionToken,
  OptionCallSyntheticIdMock,
  OptionController,
  Registry,
  TestToken,
  ChainlinkOracleSubId,
  OracleAggregator,
} from "../../../typechain";
import { TDerivative } from "../../../types";
import { timeTravel } from "../../../utils/evm";
import { decodeEvents } from "../../../utils/events";

describe("e2e", () => {
  let users: TNamedSigners;
  let registry: Registry;
  let oracleAggregator: OracleAggregator;
  let shortOpiumPositionToken: OpiumPositionToken;
  let longOpiumPositionToken: OpiumPositionToken;
  let collateralToken: TestToken;
  let optionCallMock: OptionCallSyntheticIdMock;
  let optionController: OptionController;
  let chainlinkOracleSubId: ChainlinkOracleSubId;
  let derivative: TDerivative;

  const amount = toBN("2");

  before(async () => {
    ({
      contracts: { optionCallMock, registry, testToken: collateralToken, oracleAggregator },
      users,
    } = await setup());
    const OptionController = await ethers.getContractFactory("OptionController");
    const ChainlinkOracleSubId = await ethers.getContractFactory("ChainlinkOracleSubId");
    optionController = <OptionController>await OptionController.deploy(registry.address);
    optionController = <OptionController>await optionController.deployed();
    chainlinkOracleSubId = <ChainlinkOracleSubId>await ChainlinkOracleSubId.deploy(registry.address);
    chainlinkOracleSubId = <ChainlinkOracleSubId>await chainlinkOracleSubId.deployed();

    // setup (ensures the traders are sufficiently funded)
    await collateralToken.transfer(users.seller.address, mulWithPrecisionFactor(toBN("2"), amount));
    await collateralToken.transfer(users.buyer.address, mulWithPrecisionFactor(toBN("2"), amount));

    /**
     * ***********************************
     *        AAVE/ETH call option
     * ***********************************
     *
     * margin -> 2e18
     * endTime -> 10 days from now
     * strike price -> 72720000000000000 -> 0.07272 denominated in ETH
     * token -> erc20 to be used as a collateral
     * oracleId -> AAVE/ETH Chainlink pricefeed
     */
    derivative = derivativeFactory({
      margin: toBN("2"),
      endTime: await createValidDerivativeExpiry(10),
      params: [cast("72720000000000000")],
      syntheticId: optionCallMock.address,
      token: collateralToken.address,
      oracleId: chainlinkOracleSubId.address,
    });
    // saves the derivative recipe in the OptionController
    await optionController.setDerivative(derivative);

    /**
     * synthetic author allows third-party accounts to execute the option on their behalf
     * i.e: it's necessary if the msg.sender calling `core.execute` is an intermediary contract rather than the synthetic author's account itself
     */
    await optionCallMock.connect(users.seller).allowThirdpartyExecution(true);
    await optionCallMock.connect(users.buyer).allowThirdpartyExecution(true);
  });

  it("creates a derivative and mints a market neutral LONG/SHORT position amount", async () => {
    const collateralTokenBalanceBefore = await collateralToken.balanceOf(users.seller.address);
    console.log(`collateralTokenBalanceBefore: ${collateralTokenBalanceBefore.toString()}`);
    //
    await collateralToken
      .connect(users.seller)
      .approve(optionController.address, mulWithPrecisionFactor(derivative.margin, amount));
    await optionController.connect(users.seller).create(amount);

    const shortOpiumPositionTokenAddress = await optionController.getPositionAddress(false);
    shortOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortOpiumPositionTokenAddress)
    ));
    const longOpiumPositionTokenAddress = await optionController.getPositionAddress(true);
    longOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", longOpiumPositionTokenAddress)
    ));
    const shortBalance = await shortOpiumPositionToken.balanceOf(users.seller.address);
    const longBalance = await longOpiumPositionToken.balanceOf(users.seller.address);

    expect(shortBalance, "wrong SHORT balance").to.be.eq(amount);
    expect(longBalance, "wrong LONG balance").to.be.eq(amount);
    expect(longBalance, "wrong SHORT and LONG balance").to.be.eq(shortBalance);
  });

  it("allows the `seller` to sell OTC the LONG positions to a `buyer`", async () => {
    const collateralTokenBalanceBeforeSeller = await collateralToken.balanceOf(users.seller.address);

    // seller sends the full amount of LONG positions to the buyer
    await longOpiumPositionToken.connect(users.seller).transfer(users.buyer.address, amount);
    // buyer sends collateral to seller
    await collateralToken
      .connect(users.buyer)
      .transfer(users.seller.address, amount);

    const shortBalance = await shortOpiumPositionToken.balanceOf(users.seller.address);
    const longBalanceSeller = await longOpiumPositionToken.balanceOf(users.seller.address);
    const longBalanceBuyer = await longOpiumPositionToken.balanceOf(users.buyer.address);
    const collateralTokenBalanceAfterSeller = await collateralToken.balanceOf(users.seller.address);

    expect(shortBalance, "wrong SHORT balance").to.be.eq(amount);
    expect(longBalanceSeller, "wrong LONG balance").to.be.eq(0);
    expect(longBalanceBuyer, "wrong SHORT and LONG balance").to.be.eq(amount);
    expect(longBalanceBuyer, "wrong seller's collateral").to.be.eq(amount);
    expect(collateralTokenBalanceAfterSeller, "wrong seller's collateralToken balance").to.be.eq(
      collateralTokenBalanceBeforeSeller.add(amount),
    );
  });

  it("ensures that the oracleId correctly pushes the required pricefeed data into `Opium.OracleAggregator` upon the derivative's maturity", async () => {
    // timetravel slightly after the maturity of the derivative contract
    await timeTravel(derivative.endTime + 100);
    // the derivative's oracleId pushes the data required to settle the option contract into the OracleAggregator
    const tx = await chainlinkOracleSubId.triggerCallback(derivative.endTime);
    const receipt = await tx.wait();
    const [oracleSubIdEvent] = decodeEvents<ChainlinkOracleSubId>(
      chainlinkOracleSubId,
      "LogDataProvision",
      receipt.events,
    );
    await oracleAggregator.getData(chainlinkOracleSubId.address, derivative.endTime);
    expect(oracleSubIdEvent._data, "wrong oracleAggregator data").to.be.eq(
      await oracleAggregator.getData(chainlinkOracleSubId.address, derivative.endTime),
    );
  });

  it("calculates and distributes the payout according to the scenario: seller executes all their SHORT positions and buyer executes all their LONG positions", async () => {
    const sellerCollateralTokenBalanceBefore = await collateralToken.balanceOf(users.seller.address);
    const buyerCollateralTokenBalanceBefore = await collateralToken.balanceOf(users.buyer.address);

    // executes 1e18 SHORT positions (half of the SHORT positions owned)
    await optionController.connect(users.seller).executeShort(amount);
    await optionController.connect(users.buyer).executeLong(amount);

    const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } = await optionCallMock.getExecutionPayout(
      derivative,
      await oracleAggregator.getData(chainlinkOracleSubId.address, derivative.endTime),
    );
    const { buyerMargin, sellerMargin } = await optionCallMock.getMargin(derivative);
    const authorFeeCommission = await optionCallMock.getAuthorCommission();
    const { protocolExecutionReservePart } = await registry.getProtocolParameters();

    const buyerFees = computeFees(
      calculateTotalGrossPayout(buyerMargin, sellerMargin, buyerPayoutRatio, sellerPayoutRatio, amount, EPayout.BUYER),
      authorFeeCommission,
      protocolExecutionReservePart,
    );
    const sellerFees = computeFees(
      calculateTotalGrossPayout(buyerMargin, sellerMargin, buyerPayoutRatio, sellerPayoutRatio, amount, EPayout.SELLER),
      authorFeeCommission,
      protocolExecutionReservePart,
    );
    const buyerNetPayout = calculateTotalNetPayout(
      buyerMargin,
      sellerMargin,
      buyerPayoutRatio,
      sellerPayoutRatio,
      amount,
      buyerFees.totalFee,
      EPayout.BUYER,
    );
    const sellerNetPayout = calculateTotalNetPayout(
      buyerMargin,
      sellerMargin,
      buyerPayoutRatio,
      sellerPayoutRatio,
      amount,
      sellerFees.totalFee,
      EPayout.SELLER,
    );

    const sellerCollateralTokenBalanceAfter = await collateralToken.balanceOf(users.seller.address);
    const buyerCollateralTokenBalanceAfter = await collateralToken.balanceOf(users.buyer.address);
    const shortSellerBalance = await shortOpiumPositionToken.balanceOf(users.seller.address);
    const longBuyerBalance = await longOpiumPositionToken.balanceOf(users.buyer.address);

    expect(shortSellerBalance, "wrong seller's SHORT balance").to.be.eq(0);
    expect(sellerCollateralTokenBalanceAfter, "wrong seller's collateral balance").to.be.equal(
      sellerCollateralTokenBalanceBefore.add(sellerNetPayout),
    );
    expect(longBuyerBalance, "wrong buyer's LONG balance").to.be.eq(0);
    expect(buyerCollateralTokenBalanceAfter, "wrong buyer's collateral balance").to.be.equal(
      buyerCollateralTokenBalanceBefore.add(buyerNetPayout),
    );
  });
});
