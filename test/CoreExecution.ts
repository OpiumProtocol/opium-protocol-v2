// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
// utils
import { calculateFees, calculatePayoutFee, derivativeFactory, addPositionTokens } from "../utils/derivatives";
import { cast, mul } from "../utils/bn";
import setup from "../utils/setup";
import {
  Core,
  OpiumPositionToken,
  OpiumProxyFactory,
  OptionCallSyntheticIdMock,
  OracleAggregator,
  TestToken,
  TokenSpender,
} from "../typechain";
import timeTravel from "../utils/timeTravel";
import { TNamedSigners, ICreatedDerivativeOrder } from "../types";
import {
  SECONDS_10_MINS,
  SECONDS_20_MINS,
  SECONDS_30_MINS,
  SECONDS_40_MINS,
  SECONDS_50_MINS,
  SECONDS_3_WEEKS,
} from "../utils/constants";
import { retrievePositionTokensAddresses } from "../utils/events";

const executeOne = "execute(uint8,uint256,(uint256,uint256,uint256[],address,address,address))";
const executeOneWithAddress = "execute(address,uint8,uint256,(uint256,uint256,uint256[],address,address,address))";
const executeMany = "execute(uint8[],uint256[],(uint256,uint256,uint256[],address,address,address)[])";
const executeManyWithAddress =
  "execute(address,uint8[],uint256[],(uint256,uint256,uint256[],address,address,address)[])";

const cancelOne = "cancel(uint8,uint256,(uint256,uint256,uint256[],address,address,address))";
const cancelMany = "cancel(uint8[],uint256[],(uint256,uint256,uint256[],address,address,address)[])";

describe("CoreExecution", () => {
  let fullMarginOption: ICreatedDerivativeOrder,
    overMarginOption: ICreatedDerivativeOrder,
    underMarginOption: ICreatedDerivativeOrder,
    nonProfitOption: ICreatedDerivativeOrder,
    noDataOption: ICreatedDerivativeOrder;

  let testToken: TestToken,
    core: Core,
    optionCallMock: OptionCallSyntheticIdMock,
    oracleAggregator: OracleAggregator,
    tokenSpender: TokenSpender,
    opiumProxyFactory: OpiumProxyFactory;

  let namedSigners: TNamedSigners;

  before(async () => {
    ({ core, testToken, tokenSpender, testToken, oracleAggregator, opiumProxyFactory } = await setup());

    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
    const { buyer, seller, oracle, author } = namedSigners;

    const OptionCallMock = await ethers.getContractFactory("OptionCallSyntheticIdMock", author);

    optionCallMock = <OptionCallSyntheticIdMock>await OptionCallMock.deploy();
    await optionCallMock.deployed();

    // Option with no data provided to test cancellation
    // NoDataOption
    const noDataOptionDerivative = derivativeFactory({
      margin: cast(30),
      endTime: ~~(Date.now() / 1000) + SECONDS_50_MINS, // Now + 40 mins
      params: [
        cast(200), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const noDataOptionDerivativeHash = await core.getDerivativeHash(noDataOptionDerivative);
    const noDataOptionPayload = {
      derivative: noDataOptionDerivative,
      amount: 3,
      price: cast(230), // full margin profit
      hash: noDataOptionDerivativeHash,
    };

    // Full margin option
    const fullMarginOptionDerivative = derivativeFactory({
      margin: cast(30),
      endTime: ~~(Date.now() / 1000) + SECONDS_40_MINS, // Now + 40 mins
      params: [
        cast(200), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const fullMarginOptionDerivativeHash = await core.getDerivativeHash(fullMarginOptionDerivative);
    const fullMarginOptionPayload = {
      derivative: fullMarginOptionDerivative,
      amount: 3,
      price: cast(230), // full margin profit
      hash: fullMarginOptionDerivativeHash,
    };

    await oracleAggregator
      .connect(oracle)
      .__callback(fullMarginOptionPayload.derivative.endTime, fullMarginOptionPayload.price); // Current price

    // Over margin option
    const overMarginOptionDerivative = derivativeFactory({
      margin: cast(30),
      endTime: ~~(Date.now() / 1000) + SECONDS_20_MINS, // Now + 20 mins
      params: [
        cast(200), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const overMarginOptionDerivativeHash = await core.getDerivativeHash(overMarginOptionDerivative);
    const overMarginOptionPayload = {
      derivative: overMarginOptionDerivative,
      amount: 3,
      price: cast(300), // over margin profit
      hash: overMarginOptionDerivativeHash,
    };

    await oracleAggregator
      .connect(oracle)
      .__callback(overMarginOptionPayload.derivative.endTime, overMarginOptionPayload.price); // Current price

    // Under margin option
    const underMarginOptionDerivative = derivativeFactory({
      margin: cast(30),
      endTime: ~~(Date.now() / 1000) + SECONDS_30_MINS, // Now + 30 mins
      params: [
        cast(200), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const underMarginOptionDerivativeHash = await core.getDerivativeHash(underMarginOptionDerivative);
    const underMarginOptionPayload = {
      derivative: underMarginOptionDerivative,
      amount: 3,
      price: cast(220), // under margin profit
      hash: underMarginOptionDerivativeHash,
    };

    await oracleAggregator
      .connect(oracle)
      .__callback(underMarginOptionPayload.derivative.endTime, underMarginOptionPayload.price); // Current price

    // Non pr margin option
    const nonProfitOptionDerivative = derivativeFactory({
      margin: cast(30),
      endTime: ~~(Date.now() / 1000) + SECONDS_10_MINS, // Now + 10 mins
      params: [
        cast(200), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const nonProfitOptionDerivativeHash = await core.getDerivativeHash(nonProfitOptionDerivative);
    const nonProfitOptionPayload = {
      derivative: nonProfitOptionDerivative,
      amount: 3,
      price: cast(190), // non profit
      hash: nonProfitOptionDerivativeHash,
    };

    await oracleAggregator
      .connect(oracle)
      .__callback(nonProfitOptionPayload.derivative.endTime, nonProfitOptionPayload.price); // Current price

    // Create options
    await testToken.approve(
      tokenSpender.address,
      noDataOptionPayload.derivative.margin.mul(noDataOptionPayload.amount),
    );
    const tx = await core.create(noDataOptionPayload.derivative, noDataOptionPayload.amount, [
      buyer.address,
      seller.address,
    ]);
    const receipt = await tx.wait();

    noDataOption = addPositionTokens(
      noDataOptionPayload,
      ...retrievePositionTokensAddresses(opiumProxyFactory, receipt),
    );
    await testToken.approve(
      tokenSpender.address,
      fullMarginOptionPayload.derivative.margin.mul(fullMarginOptionPayload.amount),
    );
    const tx2 = await core.create(fullMarginOptionPayload.derivative, fullMarginOptionPayload.amount, [
      buyer.address,
      seller.address,
    ]);
    const receipt2 = await tx2.wait();

    fullMarginOption = addPositionTokens(
      fullMarginOptionPayload,
      ...retrievePositionTokensAddresses(opiumProxyFactory, receipt2),
    );

    await testToken.approve(
      tokenSpender.address,
      overMarginOptionPayload.derivative.margin.mul(overMarginOptionPayload.amount),
    );
    const tx3 = await core.create(overMarginOptionPayload.derivative, overMarginOptionPayload.amount, [
      buyer.address,
      seller.address,
    ]);
    const receipt3 = await tx3.wait();
    overMarginOption = addPositionTokens(
      overMarginOptionPayload,
      ...retrievePositionTokensAddresses(opiumProxyFactory, receipt3),
    );

    await testToken.approve(
      tokenSpender.address,
      underMarginOptionPayload.derivative.margin.mul(underMarginOptionPayload.amount),
    );
    const tx4 = await core.create(underMarginOptionPayload.derivative, underMarginOptionPayload.amount, [
      buyer.address,
      seller.address,
    ]);
    const receipt4 = await tx4.wait();
    underMarginOption = addPositionTokens(
      underMarginOptionPayload,
      ...retrievePositionTokensAddresses(opiumProxyFactory, receipt4),
    );

    await testToken.approve(
      tokenSpender.address,
      nonProfitOptionPayload.derivative.margin.mul(nonProfitOptionPayload.amount),
    );
    const tx5 = await core.create(nonProfitOptionPayload.derivative, nonProfitOptionPayload.amount, [
      buyer.address,
      seller.address,
    ]);
    const receipt5 = await tx5.wait();
    nonProfitOption = addPositionTokens(
      nonProfitOptionPayload,
      ...retrievePositionTokensAddresses(opiumProxyFactory, receipt5),
    );
  });

  it("should revert execution with CORE:ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH", async () => {
    try {
      const { seller } = namedSigners;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await core
        .connect(seller)
        [executeManyWithAddress](
          seller.address,
          [1, 0],
          [1],
          [fullMarginOption.derivative, fullMarginOption.derivative],
        );
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH");
    }
  });

  it("should revert execution with CORE:ADDRESSES_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH", async () => {
    try {
      const { seller } = namedSigners;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await core.connect(seller)[executeManyWithAddress](seller.address, [1, 0], [1, 1], [fullMarginOption.derivative]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:ADDRESSES_AND_DERIVATIVES_LENGTH_DOES_NOT_MATCH");
    }
  });

  it("11should revert execution before endTime with CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED", async () => {
    const { buyer, seller } = namedSigners;

    try {
      await core.connect(buyer)[executeOne](1, 1, fullMarginOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core.connect(buyer)[executeOneWithAddress](buyer.address, 1, 1, fullMarginOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core
        .connect(buyer)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [executeMany]([1], [1], [fullMarginOption.derivative]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await core.connect(buyer)[executeManyWithAddress](buyer.address, [1], [1], [fullMarginOption.derivative]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    // Seller
    try {
      await core.connect(seller)[executeOne](1, 1, fullMarginOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      await core.connect(seller)[executeOneWithAddress](seller.address, 0, 1, fullMarginOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await core
        .connect(seller)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [executeMany]([0], [1], [fullMarginOption.derivative]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await core.connect(seller)[executeManyWithAddress](seller.address, [1], [1], [fullMarginOption.derivative]);
      throw null;
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED");
    }
  });

  it("should execute full margin option", async () => {
    const { deployer, buyer, seller, author } = namedSigners;

    await timeTravel(SECONDS_40_MINS);
    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);

    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);
    const authorFeesBefore = await core.feesVaults(author.address, testToken.address);
    const amount = fullMarginOption.amount - 1;
    await core.connect(buyer)[executeOne](1, amount, fullMarginOption.derivative);
    await core.connect(seller)[executeOne](0, amount, fullMarginOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

    const buyerPayout = fullMarginOption.derivative.margin
      .sub(calculatePayoutFee(fullMarginOption.derivative.margin))
      .mul(amount);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore.add(buyerPayout));

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore);

    const { opiumFee, authorFee } = calculateFees(fullMarginOption.derivative.margin);

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);
    expect(opiumFeesAfter).to.be.equal(opiumFeesBefore.add(mul(opiumFee, amount)));

    const authorFeesAfter = await core.feesVaults(author.address, testToken.address);
    expect(authorFeesAfter).to.be.equal(authorFeesBefore.add(mul(authorFee, amount)));
  });

  it("should revert execution before endTime with CORE:SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED", async () => {
    const { buyer, seller, thirdParty } = namedSigners;

    try {
      await core.connect(thirdParty)[executeOneWithAddress](buyer.address, 1, 1, fullMarginOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED");
    }

    try {
      await core.connect(thirdParty)[executeOneWithAddress](seller.address, 1, 1, fullMarginOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED");
    }
  });

  it("should allow execution for third parties", async () => {
    const { deployer, buyer, author, thirdParty } = namedSigners;

    await optionCallMock.connect(buyer).allowThirdpartyExecution(true);

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);
    const authorFeesBefore = await core.feesVaults(author.address, testToken.address);

    await core.connect(thirdParty)[executeOneWithAddress](buyer.address, 1, 1, fullMarginOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const buyerPayout = fullMarginOption.derivative.margin.sub(calculatePayoutFee(fullMarginOption.derivative.margin));

    expect(buyerBalanceAfter).to.be.equal(+buyerBalanceBefore + +buyerPayout);

    // Check fees
    const { opiumFee, authorFee } = calculateFees(fullMarginOption.derivative.margin);
    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);

    expect(opiumFeesAfter).to.be.equal(+opiumFeesBefore + +opiumFee);
    const authorFeesAfter = await core.feesVaults(author.address, testToken.address);
    expect(authorFeesAfter).to.equal(authorFeesBefore.add(authorFee));
  });

  it("should revert execution of invalid tokenId with Transaction reverted: function was called with incorrect parameters", async () => {
    // TODO: error does not exist, needs to be changed
    const { buyer } = namedSigners;
    try {
      // wrong enum value
      await core.connect(buyer)[executeOne](2, 1, fullMarginOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("Transaction reverted: function was called with incorrect parameters");
    }
  });

  it("should execute over margin option", async () => {
    const { deployer, buyer, seller } = namedSigners;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);

    const longPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", overMarginOption.longPositionAddress)
    );
    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", overMarginOption.shortPositionAddress)
    );

    await core.connect(buyer)[executeOne](1, overMarginOption.amount, overMarginOption.derivative);

    await core.connect(seller)[executeOne](0, overMarginOption.amount, overMarginOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const buyerPayout = overMarginOption.derivative.margin
      .sub(calculatePayoutFee(overMarginOption.derivative.margin))
      .mul(overMarginOption.amount);
    expect(buyerBalanceAfter).to.be.equal(+buyerBalanceBefore + +buyerPayout);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore);

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);

    const { opiumFee } = calculateFees(overMarginOption.derivative.margin);
    expect(opiumFeesAfter).to.be.equal(+opiumFeesBefore + opiumFee * overMarginOption.amount);
  });

  it("should execute under margin option", async () => {
    const { deployer, buyer, seller } = namedSigners;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);

    await core.connect(buyer)[executeOne](1, underMarginOption.amount, underMarginOption.derivative);

    await core.connect(seller)[executeOne](0, underMarginOption.amount, underMarginOption.derivative);

    const profit = underMarginOption.price.sub(underMarginOption.derivative.params[0]);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const buyerPayout = profit.sub(calculatePayoutFee(profit)).mul(underMarginOption.amount);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore.add(buyerPayout));

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(
      +sellerBalanceBefore.add(underMarginOption.derivative.margin.sub(profit).mul(underMarginOption.amount)),
    );

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);
    const { opiumFee } = calculateFees(profit);
    expect(opiumFeesAfter).to.be.equal(+opiumFeesBefore + opiumFee * underMarginOption.amount);
  });

  it("should execute non profit option", async () => {
    const { deployer, buyer, seller } = namedSigners;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);

    await core.connect(buyer)[executeOne](1, nonProfitOption.amount, nonProfitOption.derivative);
    await core.connect(seller)[executeOne](0, nonProfitOption.amount, nonProfitOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(
      sellerBalanceBefore.add(nonProfitOption.derivative.margin.mul(nonProfitOption.amount)),
    );

    const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);
    expect(opiumFeesAfter).to.be.equal(opiumFeesBefore);
  });

  it("should revert cancellation with CORE:CANCELLATION_IS_NOT_ALLOWED", async () => {
    const { buyer } = namedSigners;

    try {
      await core.connect(buyer)[cancelOne](1, noDataOption.amount, noDataOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:CANCELLATION_IS_NOT_ALLOWED");
    }
  });

  it("should revert execution with ORACLE_AGGREGATOR:DATA_DOESNT_EXIST", async () => {
    try {
      const { buyer } = namedSigners;
      await timeTravel(SECONDS_3_WEEKS);
      await core.connect(buyer)[executeOne](1, noDataOption.amount, noDataOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("ORACLE_AGGREGATOR:DATA_DOESNT_EXIST");
    }
  });

  it("should successfully cancel position after 2 weeks with no data", async () => {
    const { buyer, seller } = namedSigners;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);

    const amount = noDataOption.amount - 1;

    await core.connect(buyer)[cancelOne](1, amount, noDataOption.derivative);
    await core.connect(seller)[cancelOne](0, amount, noDataOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore);

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore.add(noDataOption.derivative.margin.mul(amount)));
  });

  it("should revert execution with CORE:TICKER_WAS_CANCELLED", async () => {
    const { buyer, oracle } = namedSigners;

    // Data occasionally appeared
    await oracleAggregator.connect(oracle).__callback(noDataOption.derivative.endTime, noDataOption.price);

    try {
      await core.connect(buyer)[executeOne](1, 1, noDataOption.derivative);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:TICKER_WAS_CANCELLED");
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
