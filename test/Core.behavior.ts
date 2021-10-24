// theirs
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
// utils
import { decodeEvents, retrievePositionTokensAddresses } from "../utils/events";
import { toBN } from "../utils/bn";
import {
  computeTotalGrossPayout,
  createValidDerivativeExpiry,
  derivativeFactory,
  getDerivativeHash,
} from "../utils/derivatives";
// types
import { Core, OpiumPositionToken, OpiumProxyFactory, TestToken, TokenSpender } from "../typechain";
import {timeTravel} from "../utils/timeTravel";

const executeOne = "execute(address,uint256)";

type TOutput = {
  creation: () => Promise<void>;
  execute: () => Promise<void>;
};

// seller, buyer, option
export const shouldBehaveLikeCore = (
  core: Core,
  testToken: TestToken,
  tokenSpender: TokenSpender,
  opiumProxyFactory: OpiumProxyFactory,
  optionCallMock: Contract,
  seller: SignerWithAddress,
  buyer: SignerWithAddress,
): TOutput => ({
  creation: async () => {
    const amount = toBN("3");
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(10),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const expectedDerivativeHash = getDerivativeHash(optionCall);

    const marginBalanceBefore = await testToken.balanceOf(seller.address);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [buyer.address, seller.address]);
    const receipt = await tx.wait();

    const [shortPositionAddress, longPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);
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

    expect(marginBalanceAfter).to.equal(marginBalanceBefore.sub(computeTotalGrossPayout(optionCall.margin, amount)));
    expect(buyerPositionsLongBalance).to.equal(amount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(amount);
  },
  execute: async () => {
    // const { deployer, buyer, seller, author } = namedSigners;

    // await timeTravel(SECONDS_40_MINS + 10);
    // const buyerBalanceBefore = await testToken.balanceOf(buyer.address);
    // const sellerBalanceBefore = await testToken.balanceOf(seller.address);
    // const opiumFeesBefore = await core.feesVaults(deployer.address, testToken.address);
    // const authorFeesBefore = await core.feesVaults(author.address, testToken.address);
    // const amount = fullMarginOption.amount.sub(toBN("1"));
    // await core.connect(buyer)[executeOne](fullMarginOption.longPositionAddress, amount);
    // await core.connect(seller)[executeOne](fullMarginOption.shortPositionAddress, amount);

    // const buyerBalanceAfter = await testToken.balanceOf(buyer.address);

    // const { buyerPayout, sellerPayout } = await optionCallMock.getExecutionPayout(
    //   fullMarginOption.derivative,
    //   fullMarginOption.price,
    // );
    // const authorFeeCommission = await optionCallMock.getAuthorCommission();

    // const { derivativeAuthorCommissionBase, protocolFeeCommissionBase, protocolCommissionPart } =
    //   await registry.getProtocolCommissionParams();

    // const fees = computeFees(
    //   buyerPayout,
    //   amount,
    //   authorFeeCommission,
    //   derivativeAuthorCommissionBase,
    //   protocolCommissionPart,
    //   protocolFeeCommissionBase,
    // );
    // const buyerNetPayout = computeTotalNetPayout(buyerPayout, amount, fees.totalFee);
    // expect(buyerBalanceAfter).to.be.equal(buyerBalanceBefore.add(buyerNetPayout));

    // const sellerBalanceAfter = await testToken.balanceOf(seller.address);
    // expect(sellerBalanceAfter).to.be.equal(sellerBalanceBefore.add(sellerPayout));

    // const opiumFeesAfter = await core.feesVaults(deployer.address, testToken.address);
    // expect(opiumFeesAfter, "wrong protocol fee").to.be.equal(opiumFeesBefore.add(fees.totalProtocolFee));
    // const authorFeesAfter = await core.feesVaults(author.address, testToken.address);
    // //precision issues, fix it
    // // expect(authorFeesAfter, 'wrong author fee').to.be.equal(authorFeesBefore.add(fees.totalAuthorFee));
  },
});
