// theirs
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { Contract, ContractTransaction } from "@ethersproject/contracts";
import { expect } from "./chai-setup";
// utils
import { decodeEvents, retrievePositionTokensAddresses } from "../utils/events";
import {
  computeDerivativeMargin,
  computeFees,
  getDerivativeHash,
  calculateTotalNetPayout,
  EPayout,
  calculateTotalGrossProfit,
  derivativeFactory,
  createValidDerivativeExpiry,
} from "../utils/derivatives";
// types
import {
  Core,
  OpiumPositionToken,
  OpiumProxyFactory,
  OptionCallSyntheticIdMock,
  Registry,
  TestToken,
  TokenSpender,
} from "../typechain";
import { timeTravel } from "../utils/evm";
import { TDerivative, TDerivativeOrder } from "../types";
import { cast, toBN } from "../utils/bn";
import { cancelOne, executeOne, redeemOne, semanticErrors, zeroAddress } from "../utils/constants";
import { pickError } from "../utils/misc";

export enum EPositionCreation {
  CREATE = "CREATE",
  CREATE_AND_MINT = "CREATE_AND_MINT",
  MINT = "MINT",
}

export enum ECoreActions {
  CREATE = "CREATE",
  MINT = "MINT",
  CANCEL = "CANCEL",
  REDEEM = "REDEEM",
  CLAIM_RESERVE = "CLAIM_RESERVE",
}

export type TShouldBehaveLikeCore = {
  toCreateAndMintAndExecutePositions: (
    registry: Registry,
    testToken: TestToken,
    tokenSpender: TokenSpender,
    opiumProxyFactory: OpiumProxyFactory,
    syntheticContract: Contract,
    oracleCallback: () => Promise<void>,
    seller: SignerWithAddress,
    buyer: SignerWithAddress,
    optionOrder: TDerivativeOrder,
    operationType: EPositionCreation,
  ) => Promise<void>;
  toComplyWithPausability: (
    registry: Registry,
    arg: TDerivative,
    longPositionAddress: string,
    shortPositionAddress: string,
    account: SignerWithAddress,
  ) => Promise<void>;
};

const assertFailureOrSuccess = async (
  contractFunctionCall: () => Promise<ContractTransaction>,
  expectFailure: boolean,
  expectedErrorCode: string,
): Promise<void> => {
  if (expectFailure) {
    await expect(contractFunctionCall()).to.be.revertedWith(expectedErrorCode);
  } else {
    await contractFunctionCall();
  }
};

export const shouldBehaveLikeCore = (core: Core): TShouldBehaveLikeCore => ({
  toCreateAndMintAndExecutePositions: async (
    registry: Registry,
    testToken: TestToken,
    tokenSpender: TokenSpender,
    opiumProxyFactory: OpiumProxyFactory,
    syntheticContract: Contract,
    oracleCallback: () => Promise<void>,
    seller: SignerWithAddress,
    buyer: SignerWithAddress,
    optionOrder: TDerivativeOrder,
    operationType: EPositionCreation,
  ) => {
    const { derivative, amount } = optionOrder;
    await testToken.mint(seller.address, derivative.margin.mul(2).mul(amount).div("1"));

    const expectedDerivativeHash = getDerivativeHash(derivative);

    const marginBalanceBefore = await testToken.balanceOf(seller.address);

    await testToken.connect(seller).approve(tokenSpender.address, derivative.margin.mul(amount).div(toBN("1")));
    const tx =
      operationType === EPositionCreation.CREATE
        ? await core.connect(seller).create(derivative, amount, [buyer.address, seller.address])
        : await core.connect(seller).createAndMint(derivative, amount, [buyer.address, seller.address]);
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

    const marginBalanceAfter = await testToken.balanceOf(seller.address);
    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);

    expect(marginBalanceAfter, "wrong margin balance after").to.equal(
      marginBalanceBefore.sub(computeDerivativeMargin(derivative.margin, amount)),
    );
    expect(buyerPositionsLongBalance, "wrong buyer long balance").to.equal(amount);
    expect(buyerPositionsShortBalance, "wrong buyer short balance").to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance, "wrong seller long balance").to.equal(0);
    expect(sellerPositionsShortBalance, "wrong seller short balance").to.equal(amount);

    await timeTravel(derivative.endTime + 10);
    await oracleCallback();
    const protocolAddresses = await registry.getProtocolAddresses();
    const derivativeAuthorAddress = await syntheticContract.getAuthorAddress();

    const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    const opiumFeesBefore = await core.getReservesVaultBalance(
      protocolAddresses.protocolExecutionReserveClaimer,
      testToken.address,
    );
    const authorFeesBefore = await core.getReservesVaultBalance(derivativeAuthorAddress, testToken.address);

    await core.connect(buyer)[executeOne](longPositionAddress, amount);
    await core.connect(seller)[executeOne](shortPositionAddress, amount);

    const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

    const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } =
      await syntheticContract.getExecutionPayout(optionOrder.derivative, optionOrder.price);

    const { buyerMargin, sellerMargin } = await syntheticContract.getMargin(optionOrder.derivative);
    const authorFeeCommission = await syntheticContract.getAuthorCommission();

    const { protocolExecutionReservePart } = await registry.getProtocolParameters();

    const sellerFees = computeFees(
      calculateTotalGrossProfit(buyerMargin, sellerMargin, buyerPayoutRatio, sellerPayoutRatio, amount, EPayout.SELLER),
      authorFeeCommission,
      protocolExecutionReservePart,
    );
    const buyerFees = computeFees(
      calculateTotalGrossProfit(buyerMargin, sellerMargin, buyerPayoutRatio, sellerPayoutRatio, amount, EPayout.BUYER),
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

    expect(buyerBalanceAfter, "wrong buyer balance after execution").to.be.equal(
      buyerBalanceBefore.add(buyerNetPayout),
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

    const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    expect(sellerBalanceAfter, "wrong seller balance after execution").to.be.equal(
      sellerBalanceBefore.add(sellerNetPayout),
    );

    const opiumFeesAfter = await core.getReservesVaultBalance(
      protocolAddresses.protocolExecutionReserveClaimer,
      testToken.address,
    );
    const authorFeesAfter = await core.getReservesVaultBalance(derivativeAuthorAddress, testToken.address);
    console.log(`authorFee: ${authorFeesAfter.toString()}`);
    console.log(`#opiumFeesAfter: ${opiumFeesAfter.toString()}`);

    expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(
      opiumFeesBefore.add(buyerFees.protocolFee).add(sellerFees.protocolFee),
    );
    expect(authorFeesAfter, "wrong author fee").to.be.equal(
      authorFeesBefore.add(buyerFees.authorFee).add(sellerFees.authorFee),
    );
  },
  toComplyWithPausability: async (
    registry: Registry,
    arg: TDerivative,
    longPositionAddress: string,
    shortPositionAddress: string,
    account: SignerWithAddress,
  ): Promise<void> => {
    const isCreationPaused = await registry.isProtocolPositionCreationPaused();
    const isMintingPaused = await registry.isProtocolPositionMintingPaused();
    const isRedemptionPaused = await registry.isProtocolPositionRedemptionPaused();
    const isCancellationPaused = await registry.isProtocolPositionCancellationPaused();
    // to avoid other errors (i.e: create2-related errors) that are outside the scope of the current test
    const derivativeVariation = {
      ...arg,
      endTime: await createValidDerivativeExpiry(1),
    };

    // test creation pausability
    await assertFailureOrSuccess(
      () => core.create(derivativeVariation, 0, [account.address, account.address]),
      isCreationPaused,
      pickError(semanticErrors.ERROR_CORE_PROTOCOL_POSITION_CREATION_PAUSED),
    );

    await assertFailureOrSuccess(
      () => core.createAndMint(derivativeVariation, 0, [account.address, account.address]),
      isCreationPaused,
      pickError(semanticErrors.ERROR_CORE_PROTOCOL_POSITION_CREATION_PAUSED),
    );

    await assertFailureOrSuccess(
      () =>
        core
          .connect(account)
          .mint(toBN("1"), [longPositionAddress, shortPositionAddress], [account.address, account.address]),
      isMintingPaused,
      pickError(semanticErrors.ERROR_CORE_PROTOCOL_POSITION_MINT_PAUSED),
    );

    await assertFailureOrSuccess(
      () => core.connect(account).connect(account)[redeemOne]([longPositionAddress, shortPositionAddress], cast(1)),
      isRedemptionPaused,
      pickError(semanticErrors.ERROR_CORE_PROTOCOL_POSITION_REDEMPTION_PAUSED),
    );

    try {
      await assertFailureOrSuccess(
        () => core.connect(account).connect(account)[cancelOne](longPositionAddress, toBN("1")),
        isCancellationPaused,
        pickError(semanticErrors.ERROR_CORE_PROTOCOL_POSITION_CANCELLATION_PAUSED),
      );
    } catch (error) {
      //@ts-ignore
      expect(error.message).to.include(pickError(semanticErrors.ERROR_CORE_CANT_CANCEL_DUMMY_ORACLE_ID));
    }
  },
});
