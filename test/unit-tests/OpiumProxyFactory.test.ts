// theirs
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { ethers } from "hardhat";
// utils
import setup from "../__fixtures__";
import { expect } from "../chai-setup";
import { toBN } from "../../utils/bn";
import { derivativeFactory, getDerivativeHash } from "../../utils/derivatives";
// types and constants
import { TNamedSigners } from "../../types";
import { Core, OpiumPositionToken, OpiumProxyFactory, OptionCallSyntheticIdMock } from "../../typechain";
import { TDerivative } from "../../types";
import { retrievePositionTokensAddresses } from "../../utils/events";
import { impersonateAccount, setBalance } from "../../utils/evm";
import { pickError } from "../../utils/misc";
import { customDerivativeName, semanticErrors } from "../../utils/constants";
import {
  generateExpectedOpiumPositionTokenName,
  generateExpectedOpiumPositionTokenSymbol,
} from "../../utils/testCaseGenerator";

describe("OpiumProxyFactory", () => {
  let users: TNamedSigners;
  let coreImpersonator: SignerWithAddress;
  let opiumProxyFactory: OpiumProxyFactory;
  let optionCallMock: OptionCallSyntheticIdMock;
  let core: Core;
  let derivative: TDerivative;
  let secondDerivative: TDerivative;

  before(async () => {
    ({
      contracts: { optionCallMock, opiumProxyFactory, core },
      users,
    } = await setup());

    derivative = derivativeFactory({
      margin: toBN("30"),
      endTime: 1632915687, //Tue Sep 29 2026 09:41:17 GMT+0000
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });

    secondDerivative = derivativeFactory({
      margin: toBN("31"),
      endTime: ~~(Date.now() / 1000) + 3601, // now + 1 hour
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
    });

    /**
     * impersonating core with hardhat evm methods
     */
    coreImpersonator = await impersonateAccount(core.address);
    await setBalance(coreImpersonator.address, toBN("2"));
  });

  it("expects to revert if caller is not core", async () => {
    const { buyer, seller } = users;
    await impersonateAccount(core.address);
    const amount = 1;

    const hash = getDerivativeHash(derivative);
    await expect(opiumProxyFactory.create(buyer.address, seller.address, amount, hash, derivative)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_OPIUM_PROXY_FACTORY_NOT_CORE),
    );
  });

  it("expects to mint the correct number of erc20 long/short positions", async () => {
    const { buyer, seller } = users;
    const amount = 1;

    const hash = getDerivativeHash(derivative);
    const tx = await opiumProxyFactory
      .connect(coreImpersonator)
      .create(buyer.address, seller.address, amount, hash, derivative);
    const receipt = await tx.wait();

    const [longOpiumPositionTokenAddress, shortOpiumPositionTokenAddress] = retrievePositionTokensAddresses(
      opiumProxyFactory,
      receipt,
    );

    const longOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", longOpiumPositionTokenAddress)
    ));
    const shortOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortOpiumPositionTokenAddress)
    ));

    const shortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address);
    const shortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address);

    const longOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address);
    const longOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address);

    const shortTokenData = await shortOpiumPositionToken.getPositionTokenData();
    const longTokenData = await longOpiumPositionToken.getPositionTokenData();

    expect(shortTokenData.derivative, "wrong short token's derivative data").to.matchDerivative(derivative);
    expect(longTokenData.derivative, "wrong long token's derivative data").to.matchDerivative(derivative);

    expect(shortOpiumPositionTokenSellerBalance).to.equal(amount);
    expect(shortOpiumPositionTokenBuyerBalance).to.equal(0);
    expect(longOpiumPositionTokenSellerBalance).to.equal(0);
    expect(longOpiumPositionTokenBuyerBalance).to.equal(amount);

    const longTokenSupply = await longOpiumPositionToken.totalSupply();
    const shortTokenSupply = await shortOpiumPositionToken.totalSupply();
    const longTokenName = await longOpiumPositionToken.name();
    const shortTokenName = await shortOpiumPositionToken.name();
    const longTokenSymbol = await longOpiumPositionToken.symbol();
    const shortTokenSymbol = await shortOpiumPositionToken.symbol();

    expect(longTokenName, "wrong long token name").to.be.eq(
      generateExpectedOpiumPositionTokenName(
        longTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        hash,
        true,
      ),
    );
    expect(shortTokenName, "wrong short token name").to.be.eq(
      generateExpectedOpiumPositionTokenName(
        shortTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        hash,
        false,
      ),
    );
    expect(longTokenSymbol).to.be.eq(
      generateExpectedOpiumPositionTokenSymbol(
        shortTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        hash,
        true,
      ),
    );
    expect(shortTokenSymbol).to.be.eq(
      generateExpectedOpiumPositionTokenSymbol(
        shortTokenData.derivative.endTime.toNumber(),
        customDerivativeName,
        hash,
        false,
      ),
    );
    expect(longTokenSupply).to.be.eq(amount);
    expect(shortTokenSupply).to.be.eq(amount);
  });

  it("expects to burn the correct number of erc20 long/short positions with amount set to 2", async () => {
    const { buyer, seller } = users;
    const amount = 2;

    const hash = getDerivativeHash(secondDerivative);
    const tx = await opiumProxyFactory
      .connect(coreImpersonator)
      .create(buyer.address, seller.address, amount, hash, secondDerivative);
    const receipt = await tx.wait();

    const [longOpiumPositionTokenAddress, shortOpiumPositionTokenAddress] = retrievePositionTokensAddresses(
      opiumProxyFactory,
      receipt,
    );

    const longOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", longOpiumPositionTokenAddress)
    ));
    const shortOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortOpiumPositionTokenAddress)
    ));

    const shortTokenData = await shortOpiumPositionToken.getPositionTokenData();

    expect(shortTokenData.derivative, "wrong derivative").to.matchDerivative(secondDerivative);
    expect(shortTokenData.derivative.margin, "wrong short position token derivative data").to.be.eq(
      secondDerivative.margin,
    );
    expect(shortTokenData.derivative.endTime, "wrong short position token derivative data").to.be.eq(
      secondDerivative.endTime,
    );
    expect(shortTokenData.derivativeHash, "wrong short position token derivative hash").to.be.eq(hash);
    expect(shortTokenData.positionType, "wrong short position token positionType").to.be.eq(0);

    const longTokenData = await longOpiumPositionToken.getPositionTokenData();
    expect(longTokenData.derivative, "wrong long token's derivative data").to.matchDerivative(secondDerivative);
    expect(longTokenData.derivative.margin, "wrong short position token derivative data").to.be.eq(
      secondDerivative.margin,
    );
    expect(longTokenData.derivative.endTime, "wrong short position token derivative data").to.be.eq(
      secondDerivative.endTime,
    );
    expect(longTokenData.derivativeHash, "long short position token derivative hash").to.be.eq(hash);
    expect(longTokenData.positionType, "long short position token positionType").to.be.eq(1);

    const beforeShortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address);
    const beforeShortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address);
    const beforeLongOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address);
    const beforeLongOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address);

    expect(beforeShortOpiumPositionTokenSellerBalance).to.equal(amount);
    expect(beforeShortOpiumPositionTokenBuyerBalance).to.equal(0);
    expect(beforeLongOpiumPositionTokenSellerBalance).to.equal(0);
    expect(beforeLongOpiumPositionTokenBuyerBalance).to.equal(amount);

    const tx2 = await opiumProxyFactory
      .connect(coreImpersonator)
      .burn(seller.address, shortOpiumPositionToken.address, amount);
    await tx2.wait();

    const afterShortOpiumPositionTokenSellerBalance = await shortOpiumPositionToken.balanceOf(seller.address);
    const afterShortOpiumPositionTokenBuyerBalance = await shortOpiumPositionToken.balanceOf(buyer.address);
    const afterLongOpiumPositionTokenSellerBalance = await longOpiumPositionToken.balanceOf(seller.address);
    const afterLongOpiumPositionTokenBuyerBalance = await longOpiumPositionToken.balanceOf(buyer.address);

    expect(afterShortOpiumPositionTokenSellerBalance).to.equal(0);
    expect(afterShortOpiumPositionTokenBuyerBalance).to.equal(0);
    expect(afterLongOpiumPositionTokenSellerBalance).to.equal(0);
    expect(afterLongOpiumPositionTokenBuyerBalance).to.equal(amount);
  });
});
