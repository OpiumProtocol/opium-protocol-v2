// theirs
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { Contract } from "@ethersproject/contracts";
// types
import { Core, OpiumProxyFactory, Registry, TestToken, TokenSpender } from "../typechain";
import { TDerivativeOrder } from "../types";
import { EPositionCreation, shouldBehaveLikeCore } from "./Core.behavior";
import { shouldBehaveLikeRegistry } from "./Registry.behavior";
import { SECONDS_2_WEEKS } from "../utils/constants";

export const shouldBehaveLikeProtocol = async (
  core: Core,
  registry: Registry,
  testToken: TestToken,
  tokenSpender: TokenSpender,
  opiumProxyFactory: OpiumProxyFactory,
  syntheticContract: Contract,
  oracleCallback: () => Promise<void>,
  seller: SignerWithAddress,
  buyer: SignerWithAddress,
  optionOrder: TDerivativeOrder,
): Promise<void> => {
  await shouldBehaveLikeRegistry(registry).toHaveCorrectProtocolParameters(SECONDS_2_WEEKS, 10000, 100, 1, false);
  await shouldBehaveLikeCore(core).toBeSyncWithRegistryState(registry);
  await shouldBehaveLikeCore(core).toCreateAndMintAndExecutePositions(
    registry,
    testToken,
    tokenSpender,
    opiumProxyFactory,
    syntheticContract,
    oracleCallback,
    seller,
    buyer,
    optionOrder,
    EPositionCreation.CREATE_AND_MINT,
  );
};
