// theirs
import { ethers } from "hardhat";
// utils
import { expect } from "../chai-setup";
import {
  derivativeFactory,
  addPositionTokens,
  computeTotalNetPayout,
  computeFees,
  computeTotalGrossPayout,
  getDerivativeHash,
  calculateTotalNetPayout,
  calculateTotalGrossPayout,
  EPayout,
} from "../../utils/derivatives";
import { cast, toBN } from "../../utils/bn";
import setup from "../__fixtures__";
import {
  Core,
  MaliciousTestToken,
  OpiumPositionToken,
  OpiumProxyFactory,
  OptionCallSyntheticIdMock,
  OracleAggregator,
  Registry,
  TestToken,
  TokenSpender,
} from "../../typechain";
import { resetNetwork, timeTravel } from "../../utils/evm";
import { TNamedSigners, ICreatedDerivativeOrder } from "../../types";
import {
  SECONDS_10_MINS,
  SECONDS_20_MINS,
  SECONDS_30_MINS,
  SECONDS_40_MINS,
  SECONDS_50_MINS,
  SECONDS_3_WEEKS,
  semanticErrors,
  executeOne,
  executeOneWithAddress,
  executeMany,
  cancelOne,
  executeManyWithAddress,
  customDerivativeName,
} from "../../utils/constants";
import { retrievePositionTokensAddresses } from "../../utils/events";
import { pickError } from "../../utils/misc";
import {
  generateExpectedOpiumPositionTokenName,
  generateExpectedOpiumPositionTokenSymbol,
  generateRandomDerivativeSetup,
} from "../../utils/testCaseGenerator";

describe("CoreExecution", () => {
  let fullMarginOption: ICreatedDerivativeOrder,
    overMarginOption: ICreatedDerivativeOrder,
    underMarginOption: ICreatedDerivativeOrder,
    nonProfitOption: ICreatedDerivativeOrder,
    noDataOption: ICreatedDerivativeOrder,
    delayedDataOption: ICreatedDerivativeOrder;

  let testToken: TestToken,
    maliciousTestToken: MaliciousTestToken,
    core: Core,
    optionCallMock: OptionCallSyntheticIdMock,
    oracleAggregator: OracleAggregator,
    tokenSpender: TokenSpender,
    opiumProxyFactory: OpiumProxyFactory,
    registry: Registry;

  let users: TNamedSigners;

  before(async () => {
    await resetNetwork();
  });

  before(async () => {
    ({
      contracts: {
        core,
        testToken,
        tokenSpender,
        testToken,
        maliciousTestToken,
        oracleAggregator,
        opiumProxyFactory,
        registry,
      },
      users,
    } = await setup());
    const { buyer, seller, oracle, author } = users;

    const OptionCallMock = await ethers.getContractFactory("OptionCallSyntheticIdMock", author);

    optionCallMock = <OptionCallSyntheticIdMock>await OptionCallMock.deploy();
    await optionCallMock.deployed();

    /// Options with no data provided to test cancellation
    // NoDataOption
    const noDataOptionDerivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + SECONDS_50_MINS, // Now + 40 mins
      params: [
        toBN("200"), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const noDataOptionDerivativeHash = getDerivativeHash(noDataOptionDerivative);
    const noDataOptionPayload = {
      derivative: noDataOptionDerivative,
      amount: toBN("3"),
      price: toBN("230"), // full margin profit
      hash: noDataOptionDerivativeHash,
    };

    const delayedDataOptionDerivative = derivativeFactory({
      margin: toBN("31"),
      endTime: ~~(Date.now() / 1000) + SECONDS_10_MINS * 9, // Now + 90 mins
      params: [
        toBN("130"), // Strike Price 130.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const delayedDataOptionDerivativeHash = getDerivativeHash(delayedDataOptionDerivative);
    const delayedDataOptionPayload = {
      derivative: delayedDataOptionDerivative,
      amount: toBN("3"),
      price: toBN("230"), // full margin profit
      hash: delayedDataOptionDerivativeHash,
    };

    // Full margin option
    const fullMarginOptionDerivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + SECONDS_40_MINS, // Now + 40 mins
      params: [
        toBN("200"), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const fullMarginOptionDerivativeHash = getDerivativeHash(fullMarginOptionDerivative);
    const fullMarginOptionPayload = {
      derivative: fullMarginOptionDerivative,
      amount: toBN("3"),
      price: toBN("230"), // full margin profit
      hash: fullMarginOptionDerivativeHash,
    };

    await oracleAggregator
      .connect(oracle)
      .__callback(fullMarginOptionPayload.derivative.endTime, fullMarginOptionPayload.price); // Current price

    // Over margin option
    const overMarginOptionDerivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + SECONDS_20_MINS, // Now + 20 mins
      params: [
        toBN("200"), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const overMarginOptionDerivativeHash = getDerivativeHash(overMarginOptionDerivative);
    const overMarginOptionPayload = {
      derivative: overMarginOptionDerivative,
      amount: toBN("3"),
      price: toBN("300"), // over margin profit
      hash: overMarginOptionDerivativeHash,
    };

    await oracleAggregator
      .connect(oracle)
      .__callback(overMarginOptionPayload.derivative.endTime, overMarginOptionPayload.price); // Current price

    // Under margin option
    const underMarginOptionDerivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + SECONDS_30_MINS, // Now + 30 mins
      params: [
        toBN("200"), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const underMarginOptionDerivativeHash = getDerivativeHash(underMarginOptionDerivative);
    const underMarginOptionPayload = {
      derivative: underMarginOptionDerivative,
      amount: toBN("3"),
      price: toBN("220"), // under margin profit
      hash: underMarginOptionDerivativeHash,
    };

    await oracleAggregator
      .connect(oracle)
      .__callback(underMarginOptionPayload.derivative.endTime, underMarginOptionPayload.price); // Current price

    // Non pr margin option
    const nonProfitOptionDerivative = derivativeFactory({
      margin: toBN("30"),
      endTime: ~~(Date.now() / 1000) + SECONDS_10_MINS, // Now + 10 mins
      params: [
        toBN("200"), // Strike Price 200.00$
      ],
      oracleId: oracle.address,
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const nonProfitOptionDerivativeHash = getDerivativeHash(nonProfitOptionDerivative);
    const nonProfitOptionPayload = {
      derivative: nonProfitOptionDerivative,
      amount: toBN("3"),
      price: toBN("190"), // non profit
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

    await testToken.approve(
      tokenSpender.address,
      delayedDataOptionPayload.derivative.margin.mul(delayedDataOptionPayload.amount),
    );
    const tx6 = await core.create(delayedDataOptionPayload.derivative, delayedDataOptionPayload.amount, [
      buyer.address,
      seller.address,
    ]);
    const receipt6 = await tx6.wait();

    delayedDataOption = addPositionTokens(
      delayedDataOptionPayload,
      ...retrievePositionTokensAddresses(opiumProxyFactory, receipt6),
    );
  });

  it("should revert execution with CORE:ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH", async () => {
    const { seller } = users;
    await expect(
      core
        .connect(seller)
        [executeManyWithAddress](
          seller.address,
          [fullMarginOption.longPositionAddress, fullMarginOption.shortPositionAddress],
          [1],
        ),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_CORE_POSITIONS_ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH));
  });

  it("should revert execution before endTime with CORE:EXECUTION_BEFORE_MATURITY_NOT_ALLOWED", async () => {
    const { buyer, seller } = users;

    await expect(core.connect(buyer)[executeOne](fullMarginOption.longPositionAddress, 1)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED),
    );

    await expect(core.connect(buyer)[executeMany]([fullMarginOption.longPositionAddress], [1])).to.be.revertedWith(
      pickError(semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED),
    );

    await expect(
      core.connect(buyer)[executeManyWithAddress](buyer.address, [fullMarginOption.longPositionAddress], [1]),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED));

    // Seller

    await expect(core.connect(seller)[executeOne](fullMarginOption.longPositionAddress, 1)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED),
    );

    await expect(
      core.connect(seller)[executeOneWithAddress](seller.address, fullMarginOption.shortPositionAddress, 1),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED));

    await expect(core.connect(seller)[executeMany]([fullMarginOption.shortPositionAddress], [1])).to.be.revertedWith(
      pickError(semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED),
    );

    await expect(
      core.connect(seller)[executeManyWithAddress](seller.address, [fullMarginOption.longPositionAddress], [1]),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED));
  });

  it("should execute full margin option minus 1 position", async () => {
    const { deployer, buyer, seller, author } = users;

    await timeTravel(SECONDS_40_MINS + 10);
    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.getReservesVaultBalance(deployer.address, testToken.address);
    const authorFeesBefore = await core.getReservesVaultBalance(author.address, testToken.address);

    expect(await core.getDerivativePayouts(fullMarginOption.hash), "wrong cached payouts").to.be.deep.eq([
      cast(0),
      cast(0),
    ]);

    expect(
      await core.getP2pDerivativeVaultFunds(fullMarginOption.hash),
      `wrong p2p derivative vault's value before execution`,
    ).to.be.eq(fullMarginOption.derivative.margin.mul(fullMarginOption.amount).div(toBN("1")));

    const amount = fullMarginOption.amount.sub(toBN("1"));
    await core.connect(buyer)[executeOne](fullMarginOption.longPositionAddress, amount);
    await core.connect(seller)[executeOne](fullMarginOption.shortPositionAddress, amount);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

    const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } = await optionCallMock.getExecutionPayout(
      fullMarginOption.derivative,
      fullMarginOption.price,
    );
    const { buyerMargin, sellerMargin } = await optionCallMock.getMargin(fullMarginOption.derivative);

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

    expect(
      await core.getDerivativePayouts(getDerivativeHash(fullMarginOption.derivative)),
      "wrong cached payouts",
    ).to.be.deep.eq([buyerPayoutRatio, sellerPayoutRatio]);
    expect(buyerBalanceAfter, "wrong buyer").to.be.equal(buyerBalanceBefore.add(buyerNetPayout));

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter, "wrong seller").to.be.equal(sellerBalanceBefore.add(sellerNetPayout));

    const opiumFeesAfter = await core.getReservesVaultBalance(deployer.address, testToken.address);
    expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(opiumFeesBefore.add(buyerFees.protocolFee));
    const authorFeesAfter = await core.getReservesVaultBalance(author.address, testToken.address);
    expect(authorFeesAfter, "wrong author fee").to.be.equal(
      authorFeesBefore.add(buyerFees.authorFee).add(sellerFees.authorFee),
    );
    expect(
      await core.getP2pDerivativeVaultFunds(fullMarginOption.hash),
      `wrong p2p derivative vault's value after execution`,
    ).to.be.eq(fullMarginOption.derivative.margin.mul(fullMarginOption.amount.sub(toBN("2")).div(toBN("1"))));
  });

  it("should revert execution before endTime with CORE:SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED", async () => {
    const { buyer, seller, thirdParty } = users;

    await expect(
      core.connect(thirdParty)[executeOneWithAddress](buyer.address, fullMarginOption.longPositionAddress, 1),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED));

    await expect(
      core.connect(thirdParty)[executeOneWithAddress](seller.address, fullMarginOption.longPositionAddress, 1),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED));
  });

  it("should allow execution for third parties", async () => {
    const { deployer, buyer, author, thirdParty } = users;

    await optionCallMock.connect(buyer).allowThirdpartyExecution(true);

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const opiumFeesBefore = await core.getReservesVaultBalance(deployer.address, testToken.address);
    const authorFeesBefore = await core.getReservesVaultBalance(author.address, testToken.address);
    const amount = toBN("1");
    await core.connect(thirdParty)[executeOneWithAddress](buyer.address, fullMarginOption.longPositionAddress, amount);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    const { buyerPayout, sellerPayout } = await optionCallMock.getExecutionPayout(
      fullMarginOption.derivative,
      fullMarginOption.price,
    );
    const authorFeeCommission = await optionCallMock.getAuthorCommission();

    const { protocolExecutionReservePart } = await registry.getProtocolParameters();

    const fees = computeFees(buyerPayout, authorFeeCommission, protocolExecutionReservePart);
    const buyerNetPayout = computeTotalNetPayout(buyerPayout, amount, fees.totalFee);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore.add(buyerNetPayout));
    // const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    // expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore.add(sellerPayout));

    const opiumFeesAfter = await core.getReservesVaultBalance(deployer.address, testToken.address);
    expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(opiumFeesBefore.add(fees.protocolFee));
    const authorFeesAfter = await core.getReservesVaultBalance(author.address, testToken.address);
    expect(authorFeesAfter, "wrong author fee").to.be.equal(authorFeesBefore.add(fees.authorFee));
  });

  it("should revert execution if the provided position token does not implement the expected OpiumPositionToken ABI", async () => {
    // TODO: error does not exist, needs to be changed
    const { buyer } = users;
    try {
      await core.connect(buyer)[executeOne](testToken.address, toBN("1"));
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include(
        "Transaction reverted: function selector was not recognized and there's no fallback function",
      );
    }
  });

  it("should revert execution if the provided position token was not deployed by the OpiumProxyFactory", async () => {
    const { buyer } = users;
    try {
      await core.connect(buyer)[executeOne](maliciousTestToken.address, toBN("1"));
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include(pickError(semanticErrors.ERROR_CORE_NOT_OPIUM_FACTORY_POSITIONS));
    }
  });

  it("should execute over margin option", async () => {
    const { deployer, buyer, seller, author } = users;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const authorFeesBefore = await core.getReservesVaultBalance(author.address, testToken.address);
    const opiumFeesBefore = await core.getReservesVaultBalance(deployer.address, testToken.address);
    expect(
      await core.getP2pDerivativeVaultFunds(overMarginOption.hash),
      `wrong p2p derivative vault's value before execution`,
    ).to.be.eq(overMarginOption.derivative.margin.mul(overMarginOption.amount).div(toBN("1")));

    const longPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", overMarginOption.longPositionAddress)
    );
    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", overMarginOption.shortPositionAddress)
    );

    const shortPositionTokenData = await shortPositionERC20.getPositionTokenData();
    const longPositionTokenData = await longPositionERC20.getPositionTokenData();

    expect(await shortPositionERC20.name(), "wrong ERC20 SHORT name").to.be.eq(
      generateExpectedOpiumPositionTokenName(
        shortPositionTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        overMarginOption.hash,
        false,
      ),
    );
    expect(await shortPositionERC20.symbol(), "wrong ERC20 SHORT symbol ").to.be.eq(
      generateExpectedOpiumPositionTokenSymbol(
        shortPositionTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        overMarginOption.hash,
        false,
      ),
    );
    expect(await longPositionERC20.name(), "wrong ERC20 LONG name").to.be.eq(
      generateExpectedOpiumPositionTokenName(
        longPositionTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        overMarginOption.hash,
        true,
      ),
    );
    expect(await longPositionERC20.symbol(), "wrong ERC20 LONG symbol").to.be.eq(
      generateExpectedOpiumPositionTokenSymbol(
        longPositionTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        overMarginOption.hash,
        true,
      ),
    );

    await core.connect(buyer)[executeOne](overMarginOption.longPositionAddress, overMarginOption.amount);

    await core.connect(seller)[executeOne](overMarginOption.shortPositionAddress, overMarginOption.amount);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

    const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } = await optionCallMock.getExecutionPayout(
      overMarginOption.derivative,
      overMarginOption.price,
    );
    const { buyerMargin, sellerMargin } = await optionCallMock.getMargin(overMarginOption.derivative);

    const authorFeeCommission = await optionCallMock.getAuthorCommission();

    const { protocolExecutionReservePart } = await registry.getProtocolParameters();

    const buyerFees = computeFees(
      calculateTotalGrossPayout(
        buyerMargin,
        sellerMargin,
        buyerPayoutRatio,
        sellerPayoutRatio,
        overMarginOption.amount,
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
        overMarginOption.amount,
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
      overMarginOption.amount,
      buyerFees.totalFee,
      EPayout.BUYER,
    );
    const sellerNetPayout = calculateTotalNetPayout(
      buyerMargin,
      sellerMargin,
      buyerPayoutRatio,
      sellerPayoutRatio,
      overMarginOption.amount,
      sellerFees.totalFee,
      EPayout.SELLER,
    );
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore.add(buyerNetPayout));

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore.add(sellerNetPayout));

    const opiumFeesAfter = await core.getReservesVaultBalance(deployer.address, testToken.address);
    expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(opiumFeesBefore.add(buyerFees.protocolFee));

    const authorFeesAfter = await core.getReservesVaultBalance(author.address, testToken.address);
    expect(authorFeesAfter, "wrong author fee").to.be.equal(
      authorFeesBefore.add(buyerFees.authorFee).add(sellerFees.authorFee),
    );
    expect(
      await core.getP2pDerivativeVaultFunds(fullMarginOption.hash),
      `wrong p2p derivative vault's value after execution`,
    ).to.be.eq(0);
  });

  it("should execute under margin option", async () => {
    const { deployer, buyer, seller } = users;
    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.getReservesVaultBalance(deployer.address, testToken.address);

    await core.connect(buyer)[executeOne](underMarginOption.longPositionAddress, underMarginOption.amount);

    await core.connect(seller)[executeOne](underMarginOption.shortPositionAddress, underMarginOption.amount);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

    const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } = await optionCallMock.getExecutionPayout(
      underMarginOption.derivative,
      underMarginOption.price,
    );
    const { buyerMargin, sellerMargin } = await optionCallMock.getMargin(underMarginOption.derivative);

    const authorFeeCommission = await optionCallMock.getAuthorCommission();

    const { protocolExecutionReservePart } = await registry.getProtocolParameters();

    const buyerFees = computeFees(
      calculateTotalGrossPayout(
        buyerMargin,
        sellerMargin,
        buyerPayoutRatio,
        sellerPayoutRatio,
        underMarginOption.amount,
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
        overMarginOption.amount,
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
      underMarginOption.amount,
      buyerFees.totalFee,
      EPayout.BUYER,
    );
    const sellerNetPayout = calculateTotalNetPayout(
      buyerMargin,
      sellerMargin,
      buyerPayoutRatio,
      sellerPayoutRatio,
      underMarginOption.amount,
      sellerFees.totalFee,
      EPayout.SELLER,
    );

    const opiumFeesAfter = await core.getReservesVaultBalance(deployer.address, testToken.address);
    const sellerBalanceAfter = await testToken.balanceOf(seller.address);

    expect(buyerBalanceAfter, "wrong buyer balance").to.be.equal(buyerBalanceBefore.add(buyerNetPayout));
    expect(sellerBalanceAfter, "wrong seller balance").to.be.equal(sellerBalanceBefore.add(sellerNetPayout));
    expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(opiumFeesBefore.add(buyerFees.protocolFee));
  });

  it("should execute non profit option", async () => {
    const { deployer, buyer, seller } = users;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.getReservesVaultBalance(deployer.address, testToken.address);

    await core.connect(buyer)[executeOne](nonProfitOption.longPositionAddress, nonProfitOption.amount);
    await core.connect(seller)[executeOne](nonProfitOption.shortPositionAddress, nonProfitOption.amount);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

    const { buyerPayout, sellerPayout } = await optionCallMock.getExecutionPayout(
      nonProfitOption.derivative,
      nonProfitOption.price,
    );
    const authorFeeCommission = await optionCallMock.getAuthorCommission();

    const { protocolExecutionReservePart } = await registry.getProtocolParameters();

    const fees = computeFees(buyerPayout, authorFeeCommission, protocolExecutionReservePart);

    const opiumFeesAfter = await core.getReservesVaultBalance(deployer.address, testToken.address);
    const buyerNetPayout = computeTotalNetPayout(buyerPayout, nonProfitOption.amount, fees.totalFee);
    const sellerNetPayout = computeTotalGrossPayout(sellerPayout, underMarginOption.amount);

    expect(buyerBalanceAfter, "wrong buyer balance").to.be.equal(buyerBalanceBefore.add(buyerNetPayout));

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter, "wrong seller balance").to.be.equal(sellerBalanceBefore.add(sellerNetPayout));

    expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(opiumFeesBefore.add(fees.protocolFee));
  });

  it("should revert execution with ORACLE_AGGREGATOR:DATA_DOESNT_EXIST", async () => {
    const { buyer } = users;
    await timeTravel(SECONDS_3_WEEKS);
    await expect(
      core.connect(buyer)[executeOne](noDataOption.longPositionAddress, noDataOption.amount),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_ORACLE_AGGREGATOR_DATA_DOESNT_EXIST));
  });

  it("should successfully cancel position after 2 weeks with no data", async () => {
    const { buyer, seller } = users;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);

    await core.connect(buyer)[cancelOne](noDataOption.longPositionAddress, noDataOption.amount);
    await core.connect(seller)[cancelOne](noDataOption.shortPositionAddress, noDataOption.amount);

    const { buyerMargin, sellerMargin } = await optionCallMock.getMargin(noDataOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore.add(buyerMargin.mul(noDataOption.amount).div(toBN("1"))));

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(
      sellerBalanceBefore.add(sellerMargin.mul(noDataOption.amount).div(toBN("1"))),
    );
  });

  it("should successfully cancel the buyer's position, then a day later the OracleAggregator should receive the required data from the OracleId and lastly it should successfully let the seller cancel their position", async () => {
    const { buyer, seller, oracle } = users;

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);

    await core.connect(buyer)[cancelOne](delayedDataOption.longPositionAddress, fullMarginOption.amount);
    await timeTravel(60 * 60 * 24);
    await oracleAggregator.connect(oracle).__callback(delayedDataOption.derivative.endTime, delayedDataOption.price);
    await core.connect(seller)[cancelOne](delayedDataOption.shortPositionAddress, delayedDataOption.amount);

    const { buyerMargin, sellerMargin } = await optionCallMock.getMargin(delayedDataOption.derivative);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);
    expect(buyerBalanceAfter).to.be.equal(
      buyerBalanceBefore.add(buyerMargin.mul(delayedDataOption.amount).div(toBN("1"))),
    );

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter).to.be.equal(
      sellerBalanceBefore.add(sellerMargin.mul(delayedDataOption.amount).div(toBN("1"))),
    );
  });

  it("should revert execution with CORE:TICKER_WAS_CANCELLED", async () => {
    const { buyer, oracle } = users;

    // Data occasionally appeared
    await oracleAggregator.connect(oracle).__callback(noDataOption.derivative.endTime, noDataOption.price);
    await expect(core.connect(buyer)[executeOne](noDataOption.longPositionAddress, 1)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_CORE_TICKER_WAS_CANCELLED),
    );
  });

  it("should successfully withdraw the accrued fees", async () => {
    const { deployer, author } = users;

    const ownerBalanceBefore = await testToken.balanceOf(deployer.address);
    const authorBalanceBefore = await testToken.balanceOf(author.address);

    const opiumFees = await core.getReservesVaultBalance(deployer.address, testToken.address);
    const authorFees = await core.getReservesVaultBalance(author.address, testToken.address);

    await core["claimReserves(address)"](testToken.address);
    await core.connect(author)["claimReserves(address)"](testToken.address);

    const ownerBalanceAfter = await testToken.balanceOf(deployer.address);
    const authorBalanceAfter = await testToken.balanceOf(author.address);

    expect(ownerBalanceAfter).to.be.equal(ownerBalanceBefore.add(opiumFees));
    expect(authorBalanceAfter).to.equal(authorBalanceBefore.add(authorFees));
  });
});
