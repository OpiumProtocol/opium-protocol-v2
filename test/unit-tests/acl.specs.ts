// theirs
import { expect } from "../chai-setup";
import async from "async";
// utils
import setup, { getNamedSigners } from "../__fixtures__";
import { pickError } from "../../utils/misc";
// types and constants
import { TNamedSigners } from "../../types";
import { semanticErrors, governanceRoles, SECONDS_3_WEEKS } from "../../utils/constants";
import { Registry } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

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
      await expect(registry.connect(account).setProtocolExecutionReserveClaimer(arg.address)).to.revertedWith(
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
      await expect(registry.connect(account).setProtocolRedemptionReserveClaimer(arg.address)).to.revertedWith(
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
      await expect(registry.connect(account).setNoDataCancellationPeriod(SECONDS_3_WEEKS)).to.revertedWith(
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
      await expect(registry.connect(account).addToWhitelist(arg.address)).to.revertedWith(
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
      await expect(registry.connect(account).removeFromWhitelist(arg.address)).to.revertedWith(
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
      await expect(registry.connect(account).setProtocolExecutionReservePart(arg)).to.revertedWith(
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
      await expect(registry.connect(account).setDerivativeAuthorExecutionFeeCap(arg)).to.revertedWith(
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
      await expect(registry.connect(account).setProtocolRedemptionReservePart(arg)).to.revertedWith(
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
      await expect(registry.connect(account).setDerivativeAuthorRedemptionReservePart(arg)).to.revertedWith(
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
      await expect(registry.connect(account).pause()).to.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN_ROLE),
      );
    }
  },
  unpause: async (registry: Registry, account: SignerWithAddress) => {
    /// role of the current setter
    const setterRole = governanceRoles.partialGlobalUnpauserRole;
    // ensures that the role is as expected
    if (await registry.hasRole(setterRole, account.address)) {
      console.log(`account ${account.address} has ${setterRole} role`);
      await registry.connect(account).unpause();
      const isPaused = await registry.isProtocolPaused();
      expect(isPaused, "wrong global pause value").to.be.eq(false);
    } else {
      console.log(`account ${account.address} does not have ${setterRole} role`);
      await expect(registry.connect(account).unpause()).to.revertedWith(
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
      await expect(registry.connect(account).pauseProtocolPositionCreation()).to.revertedWith(
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
      await expect(registry.connect(account).pauseProtocolPositionMinting()).to.revertedWith(
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
      await expect(registry.connect(account).pauseProtocolPositionRedemption()).to.revertedWith(
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
      await expect(registry.connect(account).pauseProtocolPositionExecution()).to.revertedWith(
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
      await expect(registry.connect(account).pauseProtocolPositionCancellation()).to.revertedWith(
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
      await expect(registry.connect(account).pauseProtocolReserveClaim()).to.revertedWith(
        pickError(semanticErrors.ERROR_REGISTRY_ONLY_PARTIAL_CLAIM_RESERVE_PAUSE_ROLE),
      );
    }
  },
};

describe("Acl", () => {
  let users: TNamedSigners;
  let registry: Registry;

  before(async () => {
    ({
      contracts: { registry },
      users,
    } = await setup());
  });

  context("should test expected failures", async () => {
    await async.forEach(Object.keys(protectedFunctions), async (protectedFunction: keyof typeof protectedFunctions) => {
      it(`${protectedFunction} should succeed`, done => {
        protectedFunctions[protectedFunction](registry, users.governor)
          .then(() => {
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });
  });

  context("should test expected successful calls", async () => {
    await async.forEach(Object.keys(protectedFunctions), async (protectedFunction: keyof typeof protectedFunctions) => {
      it(`${protectedFunction} should succeed`, done => {
        protectedFunctions[protectedFunction](registry, users.governor)
          .then(() => {
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });
  });
});
