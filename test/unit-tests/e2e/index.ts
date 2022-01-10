// theirs
import { ethers } from "hardhat";
// utils
import { expect } from "../../chai-setup";
import { toBN } from "../../../utils/bn";
import { createValidDerivativeExpiry, derivativeFactory, getDerivativeHash } from "../../../utils/derivatives";
import setup from "../../__fixtures__";
// types and constants
import { TNamedSigners } from "../../../types";
import {
  OpiumPositionToken,
  OptionCallSyntheticIdMock,
  OptionController,
  Registry,
  TestToken,
} from "../../../typechain";
import { TDerivative } from "../../../types";
import { timeTravel } from "../../../utils/evm";

describe("e2e", () => {
  let users: TNamedSigners;
  let registry: Registry;
  let shortOpiumPositionToken: OpiumPositionToken;
  let longOpiumPositionToken: OpiumPositionToken;
  let testToken: TestToken;
  let optionCallMock: OptionCallSyntheticIdMock;
  let optionController: OptionController;
  let derivative: TDerivative;

  const amount = toBN("2");

  before(async () => {
    ({
      contracts: { optionCallMock, registry, testToken },
      users,
    } = await setup());
    const OptionController = await ethers.getContractFactory("OptionController");
    optionController = <OptionController>await OptionController.deploy(registry.address);
    optionController = <OptionController>await optionController.deployed();

    derivative = derivativeFactory({
      margin: toBN("30"),
      endTime: await createValidDerivativeExpiry(10),
      params: [toBN("200")],
      syntheticId: optionCallMock.address,
      token: testToken.address,
    });

    await optionCallMock.allowThirdpartyExecution(true);
  });

  it("creates a derivative", async () => {
    await optionController.setDerivative(derivative);
    const testTokenBalanceBefore = await testToken.balanceOf(users.deployer.address);
    console.log(`testTokenBalanceBefore: ${testTokenBalanceBefore.toString()}`);

    await testToken.approve(optionController.address, derivative.margin.mul(amount).div(toBN("1")));
    await optionController.create(amount);
    const shortOpiumPositionTokenAddress = await optionController.getPositionAddress(false);
    shortOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", shortOpiumPositionTokenAddress)
    ));
    const shortBalance = await shortOpiumPositionToken.balanceOf(users.deployer.address);

    const longOpiumPositionTokenAddress = await optionController.getPositionAddress(true);
    longOpiumPositionToken = await (<OpiumPositionToken>(
      await ethers.getContractAt("OpiumPositionToken", longOpiumPositionTokenAddress)
    ));
    const longBalance = await longOpiumPositionToken.balanceOf(users.deployer.address);
    expect(shortBalance, "wrong SHORT balance").to.be.eq(amount);
    expect(longBalance, "wrong LONG balance").to.be.eq(amount);
    expect(longBalance, "wrong SHORT and LONG balance").to.be.eq(shortBalance);
  });

  it("executes 1 SHORT and 2 LONG and returns the initially allocated collateral", async () => {
    await timeTravel(derivative.endTime + 100);
    const testTokenBalanceBefore = await testToken.balanceOf(users.deployer.address);

    await optionController.executeShort(toBN("1"));

    const shortBalance = await shortOpiumPositionToken.balanceOf(users.deployer.address);
    const testTokenBalanceAfterShortExecution = await testToken.balanceOf(users.deployer.address);

    expect(shortBalance, "wrong SHORT balance").to.be.eq(amount.sub(toBN("1")));
    expect(testTokenBalanceAfterShortExecution, "wrong collateral balance").to.be.eq(
      testTokenBalanceBefore.add(derivative.margin),
    );

    await optionController.executeLong(amount);
    const longBalance = await longOpiumPositionToken.balanceOf(users.deployer.address);
    const testTokenBalanceAfterLongExecution = await testToken.balanceOf(users.deployer.address);

    expect(longBalance, "wrong LONG balance").to.be.eq(0);
    expect(testTokenBalanceAfterLongExecution, "wrong collateral balance").to.be.eq(
      testTokenBalanceBefore.add(derivative.margin),
    );
  });
});

