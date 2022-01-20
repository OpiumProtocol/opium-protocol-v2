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
  OptionController,
  Registry,
  TestToken,
  ChainlinkOracleSubId,
  OracleAggregator,
  OptionPutSyntheticIdMock,
} from "../../../typechain";
import { TDerivative } from "../../../types";
import { timeTravel } from "../../../utils/evm";
import { decodeEvents } from "../../../utils/events";
import { hardhatNetworkEnvironment } from "../../../hardhat.config";

/**
 * set the process.env.HARDHAT_NETWORK_ENVIRONMENT to `fork` to run the current tests using the Ethereum mainnet
 * {see hardhat.config.ts}
 */

if (hardhatNetworkEnvironment === "fork") {
  describe("e2e", function () {
    let users: TNamedSigners;
    let registry: Registry;
    let oracleAggregator: OracleAggregator;
    let shortOpiumPositionToken: OpiumPositionToken;
    let longOpiumPositionToken: OpiumPositionToken;
    let daiCollateralMock: TestToken;
    let optionController: OptionController;
    let chainlinkOracleSubId: ChainlinkOracleSubId;
    let optionPutSyntheticIdMock: OptionPutSyntheticIdMock;
    let derivative: TDerivative;

    const amount = toBN("2");

    before(async () => {
      ({
        contracts: {
          optionPutSyntheticIdMock,
          registry,
          testToken: daiCollateralMock,
          oracleAggregator,
          optionPutSyntheticIdMock,
        },
        users,
      } = await setup());
      const OptionController = await ethers.getContractFactory("OptionController");
      const ChainlinkOracleSubId = await ethers.getContractFactory("ChainlinkOracleSubId");
      // deploys example contract to interact with `Opium.Core`
      optionController = <OptionController>await OptionController.deploy(registry.address);
      optionController = <OptionController>await optionController.deployed();
      // deploys the oracleId
      chainlinkOracleSubId = <ChainlinkOracleSubId>await ChainlinkOracleSubId.deploy(registry.address);
      chainlinkOracleSubId = <ChainlinkOracleSubId>await chainlinkOracleSubId.deployed();

      // setup (ensures the traders are sufficiently funded)
      await daiCollateralMock.transfer(users.seller.address, mulWithPrecisionFactor(toBN("1000"), amount));
      await daiCollateralMock.transfer(users.buyer.address, mulWithPrecisionFactor(toBN("1000"), amount));

      /**
       * ***********************************
       *        AAVE/ETH PUT option mock
       * ***********************************
       *
       * margin -> 2e18
       * endTime -> 10 days from now
       * strike price -> 72720000000000000 -> 0.07272 denominated in ETH
       * token -> erc20 to be used as a collateral
       * oracleId -> AAVE/ETH Chainlink pricefeed
       */
      derivative = derivativeFactory({
        margin: toBN("14"),
        endTime: await createValidDerivativeExpiry(10),
        params: [cast("68199560000000000")], // = 0.06819956 ETH
        syntheticId: optionPutSyntheticIdMock.address,
        token: daiCollateralMock.address,
        oracleId: chainlinkOracleSubId.address,
      });
      // saves the derivative recipe in the OptionController
      await optionController.setDerivative(derivative);

      /**
       * synthetic author allows third-party accounts to execute the option on their behalf
       * i.e: it's necessary if the msg.sender calling `core.execute` is an intermediary contract rather than the synthetic author's account itself
       */
      await optionPutSyntheticIdMock.connect(users.seller).allowThirdpartyExecution(true);
      await optionPutSyntheticIdMock.connect(users.buyer).allowThirdpartyExecution(true);
    });

    it("creates a derivative and mints a market neutral LONG/SHORT position amount", async () => {
      const daiCollateralMockBalanceBefore = await daiCollateralMock.balanceOf(users.seller.address);
      console.log(`daiCollateralMockBalanceBefore: ${daiCollateralMockBalanceBefore.toString()}`);
      // approves the derivative's margin amount required
      await daiCollateralMock
        .connect(users.seller)
        .approve(optionController.address, mulWithPrecisionFactor(derivative.margin, amount));
      await optionController.connect(users.seller).create(amount);

      // we calculate the SHORT erc20 position token address
      const shortOpiumPositionTokenAddress = await optionController.getPositionAddress(false);
      shortOpiumPositionToken = await (<OpiumPositionToken>(
        await ethers.getContractAt("OpiumPositionToken", shortOpiumPositionTokenAddress)
      ));

      // we calculate the SHORT erc20 position token address
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

    it("mocks an OTC exchange: the `seller` exchanges their LONG position tokens with a `buyer` for an amount of `daiCollateralMocks`", async () => {
      const daiCollateralMockBalanceBeforeSeller = await daiCollateralMock.balanceOf(users.seller.address);

      // seller sends the full amount of LONG position tokens to the buyer
      await longOpiumPositionToken.connect(users.seller).transfer(users.buyer.address, amount);
      // buyer sends collateral to seller
      await daiCollateralMock.connect(users.buyer).transfer(users.seller.address, amount);

      const shortBalance = await shortOpiumPositionToken.balanceOf(users.seller.address);
      const longBalanceSeller = await longOpiumPositionToken.balanceOf(users.seller.address);
      const longBalanceBuyer = await longOpiumPositionToken.balanceOf(users.buyer.address);
      const daiCollateralMockBalanceAfterSeller = await daiCollateralMock.balanceOf(users.seller.address);

      expect(shortBalance, "wrong SHORT balance").to.be.eq(amount);
      expect(longBalanceSeller, "wrong LONG balance").to.be.eq(0);
      expect(longBalanceBuyer, "wrong SHORT and LONG balance").to.be.eq(amount);
      expect(longBalanceBuyer, "wrong seller's collateral").to.be.eq(amount);
      expect(daiCollateralMockBalanceAfterSeller, "wrong seller's daiCollateralMock balance").to.be.eq(
        daiCollateralMockBalanceBeforeSeller.add(amount),
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
      const sellerdaiCollateralMockBalanceBefore = await daiCollateralMock.balanceOf(users.seller.address);
      const buyerdaiCollateralMockBalanceBefore = await daiCollateralMock.balanceOf(users.buyer.address);

      // seller executes their SHORT positions
      await optionController.connect(users.seller).executeShort(amount);
      // buyer executes their LONG positions
      await optionController.connect(users.buyer).executeLong(amount);

      const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } =
        await optionPutSyntheticIdMock.getExecutionPayout(
          derivative,
          await oracleAggregator.getData(chainlinkOracleSubId.address, derivative.endTime),
        );

      const { buyerMargin, sellerMargin } = await optionPutSyntheticIdMock.getMargin(derivative);
      const authorFeeCommission = await optionPutSyntheticIdMock.getAuthorCommission();
      const { protocolExecutionReservePart } = await registry.getProtocolParameters();

      // helper function to compute the fees deducted from the executed LONG positions, if any
      const buyerFees = computeFees(
        calculateTotalGrossPayout(
          buyerMargin,
          sellerMargin,
          buyerPayoutRatio,
          sellerPayoutRatio,
          amount,
          EPayout.BUYER,
        ),
        authorFeeCommission,
        protocolExecutionReservePart,
      );
      // helper function to compute the fees deducted from the executed SHORT positions, if any
      const sellerFees = computeFees(
        calculateTotalGrossPayout(
          buyerMargin,
          sellerMargin,
          buyerPayoutRatio,
          sellerPayoutRatio,
          amount,
          EPayout.SELLER,
        ),
        authorFeeCommission,
        protocolExecutionReservePart,
      );
      // helper function to compute the net payout of the LONG positions
      const buyerNetPayout = calculateTotalNetPayout(
        buyerMargin,
        sellerMargin,
        buyerPayoutRatio,
        sellerPayoutRatio,
        amount,
        buyerFees.totalFee,
        EPayout.BUYER,
      );
      // helper function to compute the net payout of the SHORT positions
      const sellerNetPayout = calculateTotalNetPayout(
        buyerMargin,
        sellerMargin,
        buyerPayoutRatio,
        sellerPayoutRatio,
        amount,
        sellerFees.totalFee,
        EPayout.SELLER,
      );

      const sellerdaiCollateralMockBalanceAfter = await daiCollateralMock.balanceOf(users.seller.address);
      const buyerdaiCollateralMockBalanceAfter = await daiCollateralMock.balanceOf(users.buyer.address);
      const sellerShortBalance = await shortOpiumPositionToken.balanceOf(users.seller.address);
      const buyerLongbalance = await longOpiumPositionToken.balanceOf(users.buyer.address);

      expect(sellerShortBalance, "wrong seller's SHORT balance").to.be.eq(0);
      expect(sellerdaiCollateralMockBalanceAfter, "wrong seller's collateral balance").to.be.equal(
        sellerdaiCollateralMockBalanceBefore.add(sellerNetPayout),
      );
      expect(buyerLongbalance, "wrong buyer's LONG balance").to.be.eq(0);
      expect(buyerdaiCollateralMockBalanceAfter, "wrong buyer's collateral balance").to.be.equal(
        buyerdaiCollateralMockBalanceBefore.add(buyerNetPayout),
      );
    });
  });
}
