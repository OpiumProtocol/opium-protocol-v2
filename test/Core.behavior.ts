// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { Contract } from "@ethersproject/contracts";
// utils
import { decodeEvents, retrievePositionTokensAddresses } from "../utils/events";
import {
  computeDerivativeMargin,
  computeFees,
  getDerivativeHash,
  calculateTotalNetPayout,
  EPayout,
  calculateTotalGrossProfit,
} from "../utils/derivatives";
// types
import {
  Core,
  OpiumPositionToken,
  OpiumProxyFactory,
  RegistryUpgradeable,
  TestToken,
  TokenSpender,
} from "../typechain";
import { timeTravel } from "../utils/evm";
import { TDerivativeOrder } from "../types";
import { toBN } from "../utils/bn";
import { customDerivativeName } from "../utils/constants";

const executeOne = "execute(address,uint256)";

// seller, buyer, option
export const shouldBehaveLikeCore = async (
  core: Core,
  registry: RegistryUpgradeable,
  testToken: TestToken,
  tokenSpender: TokenSpender,
  opiumProxyFactory: OpiumProxyFactory,
  syntheticContract: Contract,
  oracleCallback: () => Promise<void>,
  seller: SignerWithAddress,
  buyer: SignerWithAddress,
  optionOrder: TDerivativeOrder,
): Promise<void> => {
  const { derivative, amount } = optionOrder;
  await testToken.mint(seller.address, derivative.margin.mul(2).mul(amount).div("1"));

  const expectedDerivativeHash = getDerivativeHash(derivative);

  const marginBalanceBefore = await testToken.balanceOf(seller.address);

  await testToken.connect(seller).approve(tokenSpender.address, derivative.margin.mul(amount).div(toBN("1")));
  const tx = await core
    .connect(seller)
    .create(derivative, amount, [buyer.address, seller.address], customDerivativeName);
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

  const shortPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", shortPositionAddress);
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
  const opiumFeesBefore = await core.getFeeVaultsBalance(
    protocolAddresses.protocolExecutionFeeReceiver,
    testToken.address,
  );
  const authorFeesBefore = await core.getFeeVaultsBalance(derivativeAuthorAddress, testToken.address);

  await core.connect(buyer)[executeOne](longPositionAddress, amount);
  await core.connect(seller)[executeOne](shortPositionAddress, amount);

  const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

  const { buyerPayout: buyerPayoutRatio, sellerPayout: sellerPayoutRatio } = await syntheticContract.getExecutionPayout(
    optionOrder.derivative,
    optionOrder.price,
  );

  const { buyerMargin, sellerMargin } = await syntheticContract.getMargin(optionOrder.derivative);
  const authorFeeCommission = await syntheticContract.getAuthorCommission();

  const { protocolCommissionPart } = await registry.getProtocolParameters();

  const sellerFees = computeFees(
    calculateTotalGrossProfit(buyerMargin, sellerMargin, buyerPayoutRatio, sellerPayoutRatio, amount, EPayout.SELLER),
    authorFeeCommission,
    protocolCommissionPart,
  );
  const buyerFees = computeFees(
    calculateTotalGrossProfit(buyerMargin, sellerMargin, buyerPayoutRatio, sellerPayoutRatio, amount, EPayout.BUYER),
    authorFeeCommission,
    protocolCommissionPart,
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

  expect(buyerBalanceAfter, "wrong buyer balance after execution").to.be.equal(buyerBalanceBefore.add(buyerNetPayout));

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

  const opiumFeesAfter = await core.getFeeVaultsBalance(
    protocolAddresses.protocolExecutionFeeReceiver,
    testToken.address,
  );
  const authorFeesAfter = await core.getFeeVaultsBalance(derivativeAuthorAddress, testToken.address);

  expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(
    opiumFeesBefore.add(buyerFees.protocolFee).add(sellerFees.protocolFee),
  );
  expect(authorFeesAfter, "wrong author fee").to.be.equal(
    authorFeesBefore.add(buyerFees.authorFee).add(sellerFees.authorFee),
  );
};
