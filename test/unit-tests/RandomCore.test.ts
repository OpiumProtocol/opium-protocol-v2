// theirs
import async from "async";
// utils
import setup from "../__fixtures__";
import { EPositionCreation, shouldBehaveLikeCore } from "../Core.behavior";
import { generateRandomDerivativeSetup } from "../../utils/testCaseGenerator";

describe("Randomized Core.create() test cases", () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  async.forEach(new Array(10).fill(1), async () => {
    it("Test randomly generated synthetic", async () => {
      const {
        contracts: { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry, oracleIdMock },
        users,
      } = await setup();

      const derivativeOrder = await generateRandomDerivativeSetup(
        oracleIdMock.address,
        testToken.address,
        optionCallMock.address,
      );

      const oracleCallback = async () => {
        await oracleIdMock.triggerCallback(derivativeOrder.derivative.endTime, derivativeOrder.price);
      };

      await shouldBehaveLikeCore(core).toCreateAndMintAndExecutePositions(
        registry,
        testToken,
        tokenSpender,
        opiumProxyFactory,
        optionCallMock,
        oracleCallback,
        users.seller,
        users.buyer,
        derivativeOrder,
        EPositionCreation.CREATE,
      );
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  async.forEach(new Array(10).fill(1), async () => {
    it("Test Core.createAndMint() randomly generated synthetic", async () => {
      const {
        contracts: { core, testToken, optionCallMock, tokenSpender, opiumProxyFactory, registry, oracleIdMock },
        users,
      } = await setup();

      const derivativeOrder = await generateRandomDerivativeSetup(
        oracleIdMock.address,
        testToken.address,
        optionCallMock.address,
      );

      const oracleCallback = async () => {
        await oracleIdMock.triggerCallback(derivativeOrder.derivative.endTime, derivativeOrder.price);
      };

      await shouldBehaveLikeCore(core).toCreateAndMintAndExecutePositions(
        registry,
        testToken,
        tokenSpender,
        opiumProxyFactory,
        optionCallMock,
        oracleCallback,
        users.seller,
        users.buyer,
        derivativeOrder,
        EPositionCreation.CREATE_AND_MINT,
      );
    });
  });
});
