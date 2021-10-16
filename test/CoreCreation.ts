// theirs
import { ethers } from "hardhat";
import { utils } from "ethers";
import { expect } from "chai";
// utils
import { retrievePositionTokensAddresses } from "../utils/events";
import { toBN } from "../utils/bn";
import { computeTotalGrossPayout, createValidDerivativeExpiry, derivativeFactory, getDerivativeHash } from "../utils/derivatives";
import setup from "../utils/setup";
// types
import { TNamedSigners } from "../types";
import { OpiumPositionToken } from "../typechain";
import { SECONDS_40_MINS } from "../utils/constants";
import { resetNetwork } from "../utils/timeTravel";

describe("CoreCreation", () => {
  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
  });
  it(`should return the correct getDerivativeHash`, async () => {
    const { core, testToken, optionCallMock } = await setup();
    const optionCall = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(3),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: testToken.address,
      syntheticId: optionCallMock.address,
    });
    const hash = await getDerivativeHash(optionCall);
    const expectedHash = utils.solidityKeccak256(
      ["uint256", "uint256", "uint256[]", "address", "address", "address"],
      Object.values(optionCall),
    );

    expect(hash).to.not.be.empty;
    expect(hash).to.be.equal(expectedHash);
  });

  it(`should revert create OptionCall derivative with SYNTHETIC_AGGREGATOR:WRONG_MARGIN`, async () => {
    try {
      const { buyer, seller } = namedSigners;
      const { core, testToken, optionCallMock, tokenSpender } = await setup();

      const optionCall = derivativeFactory({
        margin: toBN("0"),
        endTime: await createValidDerivativeExpiry(3),
        params: [
          toBN("20000"), // Strike Price 200.00$
        ],
        token: testToken.address,
        syntheticId: optionCallMock.address,
      });
      const amount = toBN("3");
      await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
      await core.create(optionCall, amount, [buyer.address, seller.address]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.satisfy(() => {
        return message.includes('SYNTHETIC_AGGREGATOR:WRONG_MARGIN') || message.includes('CORE:SYNTHETIC_VALIDATION_ERROR')
      })
    }
  });

  it(`should revert create OptionCall derivative with CORE:SYNTHETIC_VALIDATION_ERROR`, async () => {
    try {
      const { buyer, seller } = namedSigners;
      const { core, testToken, optionCallMock, tokenSpender } = await setup();

      const optionCall = derivativeFactory({
        margin: toBN("30"),
        endTime: 0,
        params: [
          toBN("20000"), // Strike Price 200.00$
        ],
        token: testToken.address,
        syntheticId: optionCallMock.address,
      });
      const amount = toBN("3");
      await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
      await core.create(optionCall, amount, [buyer.address, seller.address]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:SYNTHETIC_VALIDATION_ERROR");
    }
  });

  it(`should revert create OptionCall derivative with 'CORE:NOT_ENOUGH_TOKEN_ALLOWANCE`, async () => {
    try {
      const { core, testToken, optionCallMock } = await setup();
      const { buyer, seller } = namedSigners;

      const optionCall = derivativeFactory({
        margin: toBN("3"),
        endTime: await createValidDerivativeExpiry(3),
        params: [
          toBN("20000"), // Strike Price 200.00$
        ],
        token: testToken.address,
        syntheticId: optionCallMock.address,
      });
      const amount = 3;
      await core.create(optionCall, amount, [buyer.address, seller.address]);
    } catch (error) {
      const { message } = error as Error;
      expect(message).to.include("CORE:NOT_ENOUGH_TOKEN_ALLOWANCE");
    }
  });

  it(`should create OptionCall derivative`, async () => {
    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
    const { deployer, buyer, seller } = namedSigners;

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
    const hash = await getDerivativeHash(optionCall);

    const balance = await testToken.balanceOf(deployer.address);

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));
    const tx = await core.create(optionCall, amount, [buyer.address, seller.address]);
    const receipt = await tx.wait();

    const [shortPositionAddress, longPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);

    expect(buyerPositionsLongBalance).to.equal(amount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(amount);
  });

  it("should create second exactly the same OptionCall derivative", async () => {
    const { buyer, seller } = namedSigners;

    const { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory } = await setup();
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

    await testToken.approve(tokenSpender.address, optionCall.margin.mul(amount));

    const hash = await getDerivativeHash(optionCall);

    const oldCoreTokenBalance = await testToken.balanceOf(core.address);

    // Create derivative
    const tx = await core.create(optionCall, amount, [buyer.address, seller.address]);
    const receipt = await tx.wait();
    const [shortPositionAddress, longPositionAddress] = retrievePositionTokensAddresses(opiumProxyFactory, receipt);

    const shortPositionERC20 = <OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortPositionAddress)
    );
    const longPositionERC20 = <OpiumPositionToken>await ethers.getContractAt("OpiumPositionToken", longPositionAddress);

    const newCoreTokenBalance = await testToken.balanceOf(core.address);

    expect(newCoreTokenBalance, 'wrong core balance').to.equal(oldCoreTokenBalance.add(computeTotalGrossPayout(optionCall.margin, amount)));

    const buyerPositionsLongBalance = await longPositionERC20.balanceOf(buyer.address);
    const buyerPositionsShortBalance = await shortPositionERC20.balanceOf(buyer.address);

    expect(buyerPositionsLongBalance, ).to.equal(amount);
    expect(buyerPositionsShortBalance).to.equal(0);

    const sellerPositionsLongBalance = await longPositionERC20.balanceOf(seller.address);
    const sellerPositionsShortBalance = await shortPositionERC20.balanceOf(seller.address);

    expect(sellerPositionsLongBalance).to.equal(0);
    expect(sellerPositionsShortBalance).to.equal(amount);
  });

  after(async() => {
    await resetNetwork()
  })
});
