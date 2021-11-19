// theirs
import { artifacts, ethers } from "hardhat";
import { deployMockContract, MockContract } from "ethereum-waffle";
// utils
import { expect } from "../chai-setup";
import setup from "../__fixtures__";
import { toBN } from "../../utils/bn";
import { impersonateAccount, setBalance } from "../../utils/evm";
// types
import { TNamedSigners } from "../../types";
import { pickError } from "../../utils/misc";
import { semanticErrors } from "../../utils/constants";

describe("TokenSpender", () => {
  let dai: MockContract;

  let namedSigners: TNamedSigners;

  before(async () => {
    namedSigners = (await ethers.getNamedSigners()) as TNamedSigners;
    const { deployer } = namedSigners;

    dai = await deployMockContract(deployer, (await artifacts.readArtifact("TestToken")).abi);
  });

  it("should revert spending by non whitelisted address", async () => {
    const { deployer, hacker } = namedSigners;
    const { tokenSpender } = await setup();

    await expect(
      tokenSpender.claimTokens(dai.address, deployer.address, hacker.address, toBN("0.01")),
    ).to.be.revertedWith(pickError(semanticErrors.ERROR_TOKEN_SPENDER_NOT_WHITELISTED));
  });

  it("should successfully spend by core", async () => {
    // Preps
    const { testToken, tokenSpender, core } = await setup();
    const { goodGuy, deployer } = namedSigners;

    const coreImpersonator = await impersonateAccount(core.address);
    //fund impersonator
    await setBalance(coreImpersonator.address, toBN("2"));

    await testToken.connect(deployer).mint(coreImpersonator.address, toBN("10"));

    await testToken.connect(coreImpersonator).approve(tokenSpender.address, toBN("0.01"));

    await tokenSpender
      .connect(coreImpersonator)
      .claimTokens(testToken.address, coreImpersonator.address, goodGuy.address, toBN("0.01"));

    expect(await testToken.balanceOf(goodGuy.address)).to.equal(toBN("0.01"));
  });
});
