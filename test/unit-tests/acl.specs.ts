// theirs
import { expect } from "../chai-setup";
import async from "async";
// utils
import setup, { getNamedSigners, TContracts } from "../__fixtures__";
import { pickError } from "../../utils/misc";
// types and constants
import { TDerivative, TNamedSigners } from "../../types";
import { semanticErrors, governanceRoles, SECONDS_3_WEEKS } from "../../utils/constants";
import { Registry } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { shouldBehaveLikeCore } from "../Core.behavior";
import { createValidDerivativeExpiry, derivativeFactory } from "../../utils/derivatives";
import { cast, toBN } from "../../utils/bn";
import { retrievePositionTokensAddresses } from "../../utils/events";

type TProtectedFunctions = {
  [key: string]: (registry: Registry, account: SignerWithAddress) => Promise<void>;
};

const protectedFunctions: TProtectedFunctions = {
  setProtocolExecutionReserveClaimer: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.executionReservePartSetterRole;
    // ensures that the role is as expected
    const arg = (await getNamedSigners()).authorized;
    if (await registry.hasRole(setterRole, account.address)) {
      await registry.connect(account).setProtocolExecutionReserveClaimer(arg.address);
      const protocolAddresses = await registry.getProtocolAddresses();
      expect(protocolAddresses.protocolExecutionReserveClaimer, "wrong protocolExecutionReserveClaimer").to.be.eq(
        arg.address,
      );
    } else {
      await expect(registry.connect(account).setProtocolExecutionReserveClaimer(arg.address)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_EXECUTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE),
      );
    }
  },
  //
  setProtocolRedemptionReserveClaimer: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.redemptionReserveClaimerAddressSetter;
    const arg = (await getNamedSigners()).authorized;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).setProtocolRedemptionReserveClaimer(arg.address);
      const protocolAddresses = await registry.getProtocolAddresses();
      expect(protocolAddresses.protocolExecutionReserveClaimer, "wrong protocolExecutionReserveClaimer").to.be.eq(
        arg.address,
      );
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).setProtocolRedemptionReserveClaimer(arg.address)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_REDEMPTION_RESERVE_CLAIMER_ADDRESS_SETTER_ROLE),
      );
    }
  },
  setNoDataCancellationPeriod: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.noDataCancellationPeriodSetterRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).setNoDataCancellationPeriod(SECONDS_3_WEEKS);
      const protocolParameters = await registry.getProtocolParameters();
      expect(protocolParameters.noDataCancellationPeriod, "wrong noDataCancellationPeriod").to.be.eq(SECONDS_3_WEEKS);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).setNoDataCancellationPeriod(SECONDS_3_WEEKS)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_NO_DATA_CANCELLATION_PERIOD_SETTER_ROLE),
      );
    }
  },
  addToWhitelist: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.whitelisterRole;
    const arg = (await getNamedSigners()).authorized;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).addToWhitelist(arg.address);
      const isWhitelisted = await registry.isCoreSpenderWhitelisted(arg.address);
      expect(isWhitelisted, "wrong isWhitelisted").to.be.true;
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).addToWhitelist(arg.address)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_WHITELISTER_ROLE),
      );
    }
  },
  removeFromWhitelist: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.whitelisterRole;
    const arg = (await getNamedSigners()).authorized;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).removeFromWhitelist(arg.address);
      const isWhitelisted = await registry.isCoreSpenderWhitelisted(arg.address);
      expect(isWhitelisted, "wrong isWhitelisted").to.be.false;
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).removeFromWhitelist(arg.address)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_WHITELISTER_ROLE),
      );
    }
  },
  setProtocolExecutionReservePart: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.executionReservePartSetterRole;
    const arg = 2000;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).setProtocolExecutionReservePart(arg);
      const protocolParameters = await registry.getProtocolParameters();
      expect(protocolParameters.protocolExecutionReservePart, "wrong noDataCancellationPeriod").to.be.eq(arg);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).setProtocolExecutionReservePart(arg)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_EXECUTION_RESERVE_PART_SETTER_ROLE),
      );
    }
  },
  setDerivativeAuthorExecutionFeeCap: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.executionFeeCapSetterRole;
    const arg = 2000;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).setDerivativeAuthorExecutionFeeCap(arg);
      const protocolParameters = await registry.getProtocolParameters();
      expect(protocolParameters.protocolExecutionReservePart, "wrong noDataCancellationPeriod").to.be.eq(arg);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).setDerivativeAuthorExecutionFeeCap(arg)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_DERIVATIVE_AUTHOR_EXECUTION_FEE_CAP_SETTER_ROLE),
      );
    }
  },
  setProtocolRedemptionReservePart: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.redemptionReserveClaimerAddressSetter;
    const arg = 4000;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).setProtocolRedemptionReservePart(arg);
      const protocolParameters = await registry.getProtocolParameters();
      expect(protocolParameters.protocolRedemptionReservePart, "wrong noDataCancellationPeriod").to.be.eq(arg);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).setProtocolRedemptionReservePart(arg)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_REDEMPTION_RESERVE_PART_SETTER_ROLE),
      );
    }
  },
  setDerivativeAuthorRedemptionReservePart: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.redemptionReservePartSetterRole;
    const arg = 93;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).setDerivativeAuthorRedemptionReservePart(arg);
      const protocolParameters = await registry.getProtocolParameters();
      expect(protocolParameters.derivativeAuthorRedemptionReservePart, "wrong noDataCancellationPeriod").to.be.eq(arg);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).setDerivativeAuthorRedemptionReservePart(arg)).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_REDEMPTION_RESERVE_PART_SETTER_ROLE),
      );
    }
  },
  pause: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.guardianRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).pause();
      const isPaused = await registry.isProtocolPaused();
      expect(isPaused, "wrong global pause value").to.be.true;
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).pause()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN_ROLE),
      );
    }
  },
  unpause: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.partialGlobalUnpauserRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      await registry.connect(account).unpause();
      const isPaused = await registry.isProtocolPaused();
      expect(isPaused, "wrong global pause value").to.be.eq(false);
      const isMintingPaused = await registry.isProtocolPositionCreationPaused();
      expect(isMintingPaused).to.be.false;
      const isRedemptionPaused = await registry.isProtocolPositionCreationPaused();
      expect(isRedemptionPaused).to.be.false;
      const isCancellationPaused = await registry.isProtocolPositionCreationPaused();
      expect(isCancellationPaused).to.be.false;
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).unpause()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PROTOCOL_UNPAUSER_ROLE),
      );
    }
  },
  pauseProtocolPositionCreation: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.partialCreatePauserRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).pauseProtocolPositionCreation();
      const isPaused = await registry.isProtocolPositionCreationPaused();
      expect(isPaused, "wrong isProtocolPositionCreationPaused").to.be.true;
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).pauseProtocolPositionCreation()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARTIAL_CREATE_PAUSE_ROLE),
      );
    }
  },
  pauseProtocolPositionMinting: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.partialMintPauserRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).pauseProtocolPositionMinting();
      const isPaused = await registry.isProtocolPositionMintingPaused();
      expect(isPaused, "wrong isProtocolPositionMintingPaused").to.be.eq(true);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).pauseProtocolPositionMinting()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARTIAL_MINT_PAUSE_ROLE),
      );
    }
  },
  pauseProtocolPositionRedemption: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.partialRedeemPauserRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).pauseProtocolPositionRedemption();
      const isPaused = await registry.isProtocolPositionRedemptionPaused();
      expect(isPaused, "wrong isProtocolPositionRedemptionPaused").to.be.eq(true);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).pauseProtocolPositionRedemption()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARTIAL_REDEEM_PAUSE_ROLE),
      );
    }
  },
  pauseProtocolPositionExecution: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.partialExecutionPauserRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).pauseProtocolPositionExecution();
      const isPaused = await registry.isProtocolPositionExecutionPaused();
      expect(isPaused, "wrong isProtocolPositionExecutionPaused").to.be.eq(true);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).pauseProtocolPositionExecution()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARTIAL_EXECUTE_PAUSE_ROLE),
      );
    }
  },
  pauseProtocolPositionCancellation: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.partialCancelPauserRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).pauseProtocolPositionCancellation();
      const isPaused = await registry.isProtocolPositionCancellationPaused();
      expect(isPaused, "wrong isProtocolPositionCancellationPaused").to.be.eq(true);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).pauseProtocolPositionCancellation()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARTIAL_CANCEL_PAUSE_ROLE),
      );
    }
  },
  pauseProtocolReserveClaim: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.redemptionReserveClaimerAddressSetter;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).pauseProtocolReserveClaim();
      const isPaused = await registry.isProtocolReserveClaimPaused();
      expect(isPaused, "wrong isProtocolReserveClaimPaused").to.be.eq(true);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).pauseProtocolReserveClaim()).to.be.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARTIAL_CLAIM_RESERVE_PAUSE_ROLE),
      );
    }
  },
};

describe("Acl", () => {
  let users: TNamedSigners;
  let contracts: TContracts;
  let derivative: TDerivative;
  let positionsAddress: string[];

  before(async () => {
    ({ contracts, users } = await setup());
    // setup
    derivative = derivativeFactory({
      margin: toBN("1"),
      endTime: await createValidDerivativeExpiry(3),
      params: [
        toBN("20000"), // Strike Price 200.00$
      ],
      token: contracts.testToken.address,
      syntheticId: contracts.optionCallMock.address,
    });
    const amount = cast(0);
    await contracts.testToken.approve(contracts.tokenSpender.address, toBN("1000"));
    const tx = await contracts.core.create(derivative, amount, [users.deployer.address, users.deployer.address]);
    const receipt = await tx.wait();
    positionsAddress = retrievePositionTokensAddresses(contracts.opiumProxyFactory, receipt);
  });

  context("should fail all function calls", async () => {
    await async.forEach(Object.keys(protectedFunctions), async (protectedFunction: keyof typeof protectedFunctions) => {
      it(`${protectedFunction} should fail`, done => {
        protectedFunctions[protectedFunction](contracts.registry, users.notAllowed)
          .then(() => {
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });
  });

  context("should perform successful function calls", async () => {
    await async.forEach(Object.keys(protectedFunctions), async (protectedFunction: keyof typeof protectedFunctions) => {
      it(`${protectedFunction} should succeed`, done => {
        protectedFunctions[protectedFunction](contracts.registry, users.governor)
          .then(() => {
            shouldBehaveLikeCore(contracts.core)
              .toComplyWithPausability(
                contracts.registry,
                derivative,
                positionsAddress[0],
                positionsAddress[1],
                users.deployer,
              )
              .then(() => {
                done();
              })
              .catch(error => {
                done(error);
              });
          })
          .then(() => {
            console.log("completed successfully");
          })
          .catch(error => {
            console.log(error);
          });
      });
    });
  });
});
