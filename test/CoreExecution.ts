//@ts-nocheck
import { ethers } from "hardhat";
import { expect } from "chai";
import { derivativeFactory } from "../utils/derivatives";
import { calculateLongTokenId, calculateShortTokenId } from "../utils/positions";
import setup from "../utils/setup";
import { Core, OptionCallSyntheticIdMock, OracleAggregator, TestToken, TokenSpender } from "../typechain";
import timeTravel from "../utils/timeTravel";
import { TNamedSigners } from "../hardhat.config";

const AUTHOR_COMMISSION = 0.0025; // 0.25%
const OPIUM_COMMISSION = 0.1; // 10% of author commission
const SECONDS_10_MINS = 60 * 10;
const SECONDS_20_MINS = 60 * 20;
const SECONDS_30_MINS = 60 * 30;
const SECONDS_40_MINS = 60 * 40;
const SECONDS_50_MINS = 60 * 50;
const SECONDS_3_WEEKS = 60 * 60 * 24 * 7 * 3;

const calculateFees = payout => {
  const opiumOverallFee = Math.floor(payout * AUTHOR_COMMISSION);

  const opiumFee = Math.floor(opiumOverallFee * OPIUM_COMMISSION);
  const authorFee = opiumOverallFee - opiumFee;

  return {
    opiumOverallFee,
    authorFee,
    opiumFee,
  };
};

const calculatePayoutFee = payout => {
  const { opiumOverallFee } = calculateFees(payout);

  return opiumOverallFee;
};

const executeOne = "execute(uint256,uint256,(uint256,uint256,uint256[],address,address,address))";
const executeOneWithAddress = "execute(address,uint256,uint256,(uint256,uint256,uint256[],address,address,address))";
const executeMany = "execute(uint256[],uint256[],(uint256,uint256,uint256[],address,address,address)[])";
const executeManyWithAddress =
  "execute(address,uint256[],uint256[],(uint256,uint256,uint256[],address,address,address)[])";

const cancelOne = "cancel(uint256,uint256,(uint256,uint256,uint256[],address,address,address))";
const cancelMany = "cancel(uint256[],uint256[],(uint256,uint256,uint256[],address,address,address)[])";

describe("CoreExecution", () => {
  let fullMarginOption, overMarginOption, underMarginOption, nonProfitOption, noDataOption;

  let testToken: TestToken,
    core: Core,
    optionCallMock: OptionCallSyntheticIdMock,
    oracleAggregator: OracleAggregator,
    tokenSpender: TokenSpender;

  let namedSigners: TNamedSigners

  before(async () => {
    ({ core, testToken, tokenSpender, testToken, oracleAggregator } = await setup());
    namedSigners = await ethers.getNamedSigners() as TNamedSigners;
    const { buyer, seller, oracle, author } = namedSigners
    
    const OptionCallMock = await ethers.getContractFactory("OptionCallSyntheticIdMock", author);
    optionCallMock = await OptionCallMock.deploy();
    await optionCallMock.deployed();

    // Option with no data provided to test cancellation
    // NoDataOption
    const noDataOptionDerivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + SECONDS_50_MINS, // Now + 40 mins
      params: [
        200, // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const noDataOptionDerivativeHash = await core.getDerivativeHash(noDataOptionDerivative);
    noDataOption = {
      derivative: noDataOptionDerivative,
      quantity: 3,
      price: 230, // full margin profit
      hash: noDataOptionDerivativeHash,
      longTokenId: calculateLongTokenId(noDataOptionDerivativeHash),
      shortTokenId: calculateShortTokenId(noDataOptionDerivativeHash),
    };

    // Full margin option
    const fullMarginOptionDerivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + SECONDS_40_MINS, // Now + 40 mins
      params: [
        200, // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const fullMarginOptionDerivativeHash = await core.getDerivativeHash(fullMarginOptionDerivative);
    fullMarginOption = {
      derivative: fullMarginOptionDerivative,
      quantity: 3,
      price: 230, // full margin profit
      hash: fullMarginOptionDerivativeHash,
      longTokenId: calculateLongTokenId(fullMarginOptionDerivativeHash),
      shortTokenId: calculateShortTokenId(fullMarginOptionDerivativeHash),
    };

    await oracleAggregator.connect(oracle).__callback(fullMarginOption.derivative.endTime, fullMarginOption.price); // Current price

    // Over margin option
    const overMarginOptionDerivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + SECONDS_20_MINS, // Now + 20 mins
      params: [
        200, // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const overMarginOptionDerivativeHash = await core.getDerivativeHash(overMarginOptionDerivative);
    overMarginOption = {
      derivative: overMarginOptionDerivative,
      quantity: 3,
      price: 300, // over margin profit
      hash: overMarginOptionDerivativeHash,
      longTokenId: calculateLongTokenId(overMarginOptionDerivativeHash),
      shortTokenId: calculateShortTokenId(overMarginOptionDerivativeHash),
    };

    await oracleAggregator.connect(oracle).__callback(overMarginOption.derivative.endTime, overMarginOption.price); // Current price

    // Under margin option
    const underMarginOptionDerivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + SECONDS_30_MINS, // Now + 30 mins
      params: [
        200, // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const underMarginOptionDerivativeHash = await core.getDerivativeHash(underMarginOptionDerivative);
    underMarginOption = {
      derivative: underMarginOptionDerivative,
      quantity: 3,
      price: 220, // under margin profit
      hash: underMarginOptionDerivativeHash,
      longTokenId: calculateLongTokenId(underMarginOptionDerivativeHash),
      shortTokenId: calculateShortTokenId(underMarginOptionDerivativeHash),
    };

    await oracleAggregator.connect(oracle).__callback(underMarginOption.derivative.endTime, underMarginOption.price); // Current price

    // Non pr margin option
    const nonProfitOptionDerivative = derivativeFactory({
      margin: 30,
      endTime: ~~(Date.now() / 1000) + SECONDS_10_MINS, // Now + 10 mins
      params: [
        200, // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const nonProfitOptionDerivativeHash = await core.getDerivativeHash(nonProfitOptionDerivative);
    nonProfitOption = {
      derivative: nonProfitOptionDerivative,
      quantity: 3,
      price: 190, // non profit
      hash: nonProfitOptionDerivativeHash,
      longTokenId: calculateLongTokenId(nonProfitOptionDerivativeHash),
      shortTokenId: calculateShortTokenId(nonProfitOptionDerivativeHash),
    };

    await oracleAggregator.connect(oracle).__callback(nonProfitOption.derivative.endTime, nonProfitOption.price); // Current price

    // Create options
    await testToken.approve(tokenSpender.address, noDataOption.derivative.margin * noDataOption.quantity);
    await core.create(noDataOption.derivative, noDataOption.quantity, [buyer.address, seller.address]);

    await testToken.approve(tokenSpender.address, fullMarginOption.derivative.margin * fullMarginOption.quantity);
    await core.create(fullMarginOption.derivative, fullMarginOption.quantity, [buyer.address, seller.address]);

    await testToken.approve(tokenSpender.address, overMarginOption.derivative.margin * overMarginOption.quantity);
    await core.create(overMarginOption.derivative, overMarginOption.quantity, [buyer.address, seller.address]);

    await testToken.approve(tokenSpender.address, underMarginOption.derivative.margin * underMarginOption.quantity);
    await core.create(underMarginOption.derivative, underMarginOption.quantity, [buyer.address, seller.address]);

    await testToken.approve(tokenSpender.address, nonProfitOption.derivative.margin * nonProfitOption.quantity);
    await core.create(nonProfitOption.derivative, nonProfitOption.quantity, [buyer.address, seller.address]);
  });

  it("should revert execution with CORE:TOKEN_IDS_AND_QUANTITIES_LENGTH_DOES_NOT_MATCH", async () => {
    try {
      const { seller } = namedSigners

      await core
        .connect(seller)
        [executeManyWithAddress](
          seller.address,
          [fullMarginOption.longTokenId, fullMarginOption.shortTokenId],
          [1],
          [fullMarginOption.derivative, fullMarginOption.derivative],
        );
    } catch (error) {
      expect(error.message).to.include("CORE:TOKEN_IDS_AND_QUANTITIES_LENGTH_DOES_NOT_MATCH");
    }
  });

  it("should revert execution with CORE:TOKEN_IDS_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH", async () => {
    try {
      const { seller } = namedSigners

      await core
        .connect(seller)
        [executeManyWithAddress](
          seller.address,
          [fullMarginOption.longTokenId, fullMarginOption.shortTokenId],
          [1, 1],
          [fullMarginOption.derivative],
        );
    } catch (error) {
      expect(error.message).to.include("CORE:TOKEN_IDS_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH");
    }
  });

  it("should revert execution before endTime with CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED", async () => {
    const { buyer, seller } = namedSigners

    try {
      await core.connect(buyer)[executeOne](fullMarginOption.longTokenId, 1, fullMarginOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core
        .connect(buyer)
        [executeOneWithAddress](buyer.address, fullMarginOption.longTokenId, 1, fullMarginOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core.connect(buyer)[executeMany]([fullMarginOption.longTokenId], [1], [fullMarginOption.derivative]);
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core
        .connect(buyer)
        [executeManyWithAddress](buyer.address, [fullMarginOption.longTokenId], [1], [fullMarginOption.derivative]);
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    // Seller
    try {
      await core.connect(seller)[executeOne](fullMarginOption.shortTokenId, 1, fullMarginOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core
        .connect(seller)
        [executeOneWithAddress](seller.address, fullMarginOption.shortTokenId, 1, fullMarginOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core.connect(seller)[executeMany]([fullMarginOption.shortTokenId], [1], [fullMarginOption.derivative]);
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core
        .connect(seller)
        [executeManyWithAddress](seller.address, [fullMarginOption.shortTokenId], [1], [fullMarginOption.derivative]);
      throw null;
    } catch (error) {
      expect(error.message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }
  });

  it("should execute full margin option", async () => {
    const { deployer, buyer, seller, author } = namedSigners;

    await timeTravel(SECONDS_40_MINS);
    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);

    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);
    const authorFeesBefore = await core.feesVaults(author.address, testToken.address);
    const quantity = fullMarginOption.quantity - 1;

    await core.connect(buyer)[executeOne](fullMarginOption.longTokenId, quantity, fullMarginOption.derivative);
    await core.connect(seller)[executeOne](fullMarginOption.shortTokenId, quantity, fullMarginOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const buyerPayout =
      (fullMarginOption.derivative.margin - calculatePayoutFee(fullMarginOption.derivative.margin)) * quantity;
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore.toNumber() + buyerPayout);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore.toNumber());

    const { opiumFee, authorFee } = calculateFees(fullMarginOption.derivative.margin);

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);
    expect(opiumFeesAfter).to.be.equal(opiumFeesBefore + opiumFee * quantity);

    const authorFeesAfter = await core.feesVaults(author.address, testToken.address);
    expect(authorFeesAfter).to.be.equal(authorFeesBefore.toNumber() + authorFee * quantity);
  });

  it("should revert execution before endTime with CORE:SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED", async () => {
    const { buyer, seller, thirdParty } = namedSigners;

    try {
      await core
        .connect(thirdParty)
        [executeOneWithAddress](buyer.address, fullMarginOption.longTokenId, 1, fullMarginOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED");
    }

    try {
      await core
        .connect(thirdParty)
        [executeOneWithAddress](seller.address, fullMarginOption.longTokenId, 1, fullMarginOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED");
    }
  });

  it("should allow execution for third parties", async () => {
    const { deployer, buyer, author, thirdParty } = namedSigners;

    await optionCallMock.connect(buyer).allowThirdpartyExecution(true);

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);
    const authorFeesBefore = await core.feesVaults(author.address, testToken.address);

    await core
      .connect(thirdParty)
      [executeOneWithAddress](buyer.address, fullMarginOption.longTokenId, 1, fullMarginOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const buyerPayout =
      fullMarginOption.derivative.margin - calculatePayoutFee(fullMarginOption.derivative.margin, true);

    expect(buyerBalanceAfter).to.be.equal(+buyerBalanceBefore + +buyerPayout);

    // Check fees
    const { opiumFee, authorFee } = calculateFees(fullMarginOption.derivative.margin);
    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);

    expect(opiumFeesAfter).to.be.equal(+opiumFeesBefore + +opiumFee);
    const authorFeesAfter = await core.feesVaults(author.address, testToken.address);
    expect(authorFeesAfter).to.equal(authorFeesBefore.toNumber() + authorFee);
  });

  it("should revert execution of invalid tokenId with CORE:UNKNOWN_POSITION_TYPE", async () => {
    const { buyer } = namedSigners
    ;
    try {
      // unknown tokenId
      await core.connect(buyer)[executeOne](12345678, 1, fullMarginOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:UNKNOWN_POSITION_TYPE");
    }
  });

  it("should execute over margin option", async () => {
    const { deployer, buyer, seller } = namedSigners

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);

    await core
      .connect(buyer)
      [executeOne](overMarginOption.longTokenId, overMarginOption.quantity, overMarginOption.derivative);

    await core
      .connect(seller)
      [executeOne](overMarginOption.shortTokenId, overMarginOption.quantity, overMarginOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const buyerPayout =
      (overMarginOption.derivative.margin - calculatePayoutFee(overMarginOption.derivative.margin)) *
      overMarginOption.quantity;
    expect(buyerBalanceAfter).to.be.equal(+buyerBalanceBefore + +buyerPayout);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore);

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);

    const { opiumFee } = calculateFees(overMarginOption.derivative.margin);
    expect(opiumFeesAfter).to.be.equal(+opiumFeesBefore + opiumFee * overMarginOption.quantity);
  });

  it("should execute under margin option", async () => {
    const { deployer, buyer, seller } = namedSigners;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);

    await core
      .connect(buyer)
      [executeOne](underMarginOption.longTokenId, underMarginOption.quantity, underMarginOption.derivative);

    await core
      .connect(seller)
      [executeOne](underMarginOption.shortTokenId, underMarginOption.quantity, underMarginOption.derivative);

    const profit = underMarginOption.price - underMarginOption.derivative.params[0];

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const buyerPayout = (profit - calculatePayoutFee(profit)) * underMarginOption.quantity;
    expect(buyerBalanceAfter).to.be.equal(+buyerBalanceBefore + buyerPayout);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(
      +sellerBalanceBefore + (underMarginOption.derivative.margin - profit) * underMarginOption.quantity,
    );

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);
    const { opiumFee } = calculateFees(profit);
    expect(opiumFeesAfter).to.be.equal(+opiumFeesBefore + opiumFee * underMarginOption.quantity);
  });

  it("should execute non profit option", async () => {
    const { deployer, buyer, seller } = namedSigners;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);

    await core
      .connect(buyer)
      [executeOne](nonProfitOption.longTokenId, nonProfitOption.quantity, nonProfitOption.derivative);
    await core
      .connect(seller)
      [executeOne](nonProfitOption.shortTokenId, nonProfitOption.quantity, nonProfitOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(
      +sellerBalanceBefore + nonProfitOption.derivative.margin * nonProfitOption.quantity,
    );

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);
    expect(opiumFeesAfter).to.be.equal(opiumFeesBefore);
  });

  it("should revert cancellation with CORE:CANCELLATION_IS_NOT_ALLOWED", async () => {
    const { buyer } = namedSigners;

    try {
      await core.connect(buyer)[cancelOne](noDataOption.longTokenId, noDataOption.quantity, noDataOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:CANCELLATION_IS_NOT_ALLOWED");
    }
  });

  it("should revert execution with ORACLE_AGGREGATOR:DATA_DOESNT_EXIST", async () => {
    try {
      const { buyer } = namedSigners;
      await timeTravel(SECONDS_3_WEEKS);
      await core.connect(buyer)[executeOne](noDataOption.longTokenId, noDataOption.quantity, noDataOption.derivative);
    } catch (error) {
      expect(error.message).to.include("ORACLE_AGGREGATOR:DATA_DOESNT_EXIST");
    }
  });

  it("should successfully cancel position after 2 weeks with no data", async () => {
    const { buyer, seller } = namedSigners;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);

    const quantity = noDataOption.quantity - 1;

    await core.connect(buyer)[cancelOne](noDataOption.longTokenId, quantity, noDataOption.derivative);
    await core.connect(seller)[cancelOne](noDataOption.shortTokenId, quantity, noDataOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(+sellerBalanceBefore + noDataOption.derivative.margin * quantity);
  });

  it("should revert execution with CORE:TICKER_WAS_CANCELLED", async () => {
    const { buyer, oracle } = namedSigners;

    // Data occasionally appeared
    await oracleAggregator.connect(oracle).__callback(noDataOption.derivative.endTime, noDataOption.price);

    try {
      await core.connect(buyer)[executeOne](noDataOption.longTokenId, 1, noDataOption.derivative);
    } catch (error) {
      expect(error.message).to.include("CORE:TICKER_WAS_CANCELLED");
    }
  });

  it("should successfully withdraw commission", async () => {
    const { deployer, author } = namedSigners;

    const ownerBalanceBefore = await testToken.balanceOf(deployer.address);
    const authorBalanceBefore = await testToken.balanceOf(author.address);

    const opiumFees = await core.feesVaults(deployer.address, testToken.address);
    const authorFees = await core.feesVaults(author.address, testToken.address);

    await core.withdrawFee(testToken.address);
    await core.connect(author).withdrawFee(testToken.address);

    const ownerBalanceAfter = await testToken.balanceOf(deployer.address);
    const authorBalanceAfter = await testToken.balanceOf(author.address);

    expect(ownerBalanceAfter).to.be.equal(ownerBalanceBefore.add(opiumFees));
    expect(authorBalanceAfter).to.equal(authorBalanceBefore.add(authorFees));
  });
});
