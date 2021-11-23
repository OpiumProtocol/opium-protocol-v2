// theirs
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { Contract } from "@ethersproject/contracts";
import { expect } from "./chai-setup";
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
import { Core, OpiumPositionToken, OpiumProxyFactory, Registry, TestToken, TokenSpender } from "../typechain";
import { timeTravel } from "../utils/evm";
import { TDerivativeOrder, TNamedSigners } from "../types";
import { toBN } from "../utils/bn";
import { shouldBehaveLikeCore } from "./Core.behavior";
import { governanceRoles, semanticErrors } from "../utils/constants";
import { pickError } from "../utils/misc";

export type TShouldBehaveLikeRegistry = {
  toHaveCorrectRoleSetup: (
    authorized: SignerWithAddress,
    notAuthorizedOne: SignerWithAddress,
    notAuthorizedTwo: SignerWithAddress,
  ) => Promise<void>;
  toHaveCorrectProtocolParameters: (
    noDataCancellationPeriod: number,
    derivativeAuthorExecutionFeeCap: number,
    derivativeAuthorRedemptionReservePart: number,
    protocolExecutionReservePart: number,
    paused: boolean,
  ) => Promise<void>;
  toHaveCorrectPausabilitySetup: (
    protocolPauser: SignerWithAddress,
    protocolUnpauser: SignerWithAddress,
    positionCreationPauser: SignerWithAddress,
    positionCancellationPauser: SignerWithAddress,
    notAuthorizedOne: SignerWithAddress,
    notAuthorizedTwo: SignerWithAddress,
  ) => Promise<void>;
};

export const shouldBehaveLikeRegistry = (registry: Registry): TShouldBehaveLikeRegistry => ({
  /// TODO: replace it with currying
  toHaveCorrectRoleSetup: async (
    authorized: SignerWithAddress,
    notAuthorizedOne: SignerWithAddress,
    notAuthorizedTwo: SignerWithAddress,
  ): Promise<void> => {
    expect(await registry.hasRole(governanceRoles.defaultAdminRole, authorized.address), "not admin").to.be.true;
    expect(
      await registry.hasRole(governanceRoles.protocolAddressesSetterRole, authorized.address),
      "not protocolAddressesSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.executionFeeRecipientSetterRole, authorized.address),
      "not executionFeeRecipientSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.redemptionFeeRecipientSetterRole, authorized.address),
      "not protocolAddressesSetterRole",
    ).to.be.true;
    expect(await registry.hasRole(governanceRoles.opiumFeeSetterRole, authorized.address), "not opiumFeeSetterRole").to
      .be.true;
    expect(
      await registry.hasRole(governanceRoles.noDataCancellationPeriodSetterRole, authorized.address),
      "not noDataCancellationPeriodSetterRole",
    ).to.be.true;
    expect(await registry.hasRole(governanceRoles.guardianRole, authorized.address), "not protocolAddressesSetterRole")
      .to.be.true;
    expect(await registry.hasRole(governanceRoles.guardianRole, authorized.address), "not guardianRole").to.be.true;
    expect(await registry.hasRole(governanceRoles.whitelisterRole, authorized.address), "not whitelisterRole").to.be
      .true;
    expect(
      await registry.hasRole(governanceRoles.redemptionFeeSetterRole, authorized.address),
      "not redemptionFeeSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.executionFeeCapSetterRole, authorized.address),
      "not executionFeeCapSetterRole",
    ).to.be.true;
    expect(await registry.hasRole(governanceRoles.registryManagerRole, authorized.address), "not registryManagerRole")
      .to.be.true;

    expect(await registry.hasRole(governanceRoles.defaultAdminRole, notAuthorizedOne.address), "wrong admin").to.be
      .false;
    expect(await registry.hasRole(governanceRoles.guardianRole, notAuthorizedOne.address), "wrong guardianRole").to.be
      .false;
    expect(
      await registry.hasRole(governanceRoles.executionFeeRecipientSetterRole, notAuthorizedTwo.address),
      "wrong executionFeeRecipientSetterRole",
    ).to.be.false;
    expect(
      await registry.hasRole(governanceRoles.protocolAddressesSetterRole, notAuthorizedTwo.address),
      "wrong protocolAddressesSetterRole",
    ).to.be.false;
  },
  toHaveCorrectProtocolParameters: async (
    noDataCancellationPeriod: number,
    derivativeAuthorExecutionFeeCap: number,
    derivativeAuthorRedemptionReservePart: number,
    protocolExecutionReservePart: number,
    paused: boolean,
  ): Promise<void> => {
    console.log("testing the registry...");
    const protocolParams = await registry.getProtocolParameters();

    expect(protocolParams.noDataCancellationPeriod, "wrong noDataCancellationPeriod").to.be.eq(
      noDataCancellationPeriod,
    );
    expect(
      protocolParams.derivativeAuthorExecutionFeeCap,
      "wrong derivativeAuthorExecutionFeeCap",
    ).to.be.eq(derivativeAuthorExecutionFeeCap);
    expect(
      protocolParams.derivativeAuthorRedemptionReservePart,
      "wrong derivativeAuthorRedemptionReservePart",
    ).to.be.eq(derivativeAuthorRedemptionReservePart);
    expect(protocolParams.protocolExecutionReservePart, "wrong protocol commission part").to.be.eq(
      protocolExecutionReservePart,
    );
    // expect(protocolParams.paused, "wrong protocol paused state").to.be.eq(paused);
  },
  toHaveCorrectPausabilitySetup: async (
    protocolPauser: SignerWithAddress,
    protocolUnpauser: SignerWithAddress,
    positionCreationPauser: SignerWithAddress,
    // positionCancellationPauser: SignerWithAddress,
    notAuthorizedOne: SignerWithAddress,
    notAuthorizedTwo: SignerWithAddress,
  ): Promise<void> => {
    // const initialState = await registry.isProtocolPaused();
    expect(await registry.isProtocolPaused(), "wrong protocol paused state").to.be.false;
    expect(await registry.isProtocolPositionCreationPaused(), "wrong protocolPositionCreation paused state").to.be
      .false;
    expect(await registry.isProtocolPositionCancellationPaused(), "wrong protocolPositionCreation paused state").to.be
      .false;

    await expect(registry.connect(protocolUnpauser).unpause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_NOT_PAUSED),
    );

    await expect(registry.connect(positionCreationPauser).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN_ROLE),
    );

    await expect(registry.connect(protocolUnpauser).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN_ROLE),
    );

    await expect(registry.connect(notAuthorizedOne).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN_ROLE),
    );

    await expect(registry.connect(notAuthorizedTwo).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN_ROLE),
    );

    await registry.connect(protocolPauser).pause();
    expect(await registry.isProtocolPaused(), "wrong protocol paused state").to.be.true;
    await expect(registry.connect(protocolPauser).pause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ALREADY_PAUSED),
    );
    expect(await registry.isProtocolPositionCreationPaused(), "wrong protocolPositionCreation paused state").to.be.true;
    expect(await registry.isProtocolPositionCancellationPaused(), "wrong protocolPositionCreation paused state").to.be
      .true;

    await expect(registry.connect(positionCreationPauser).pauseProtocolPositionCreation()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ALREADY_PAUSED),
    );

    await expect(registry.connect(protocolPauser).unpause()).to.be.revertedWith(
      pickError(semanticErrors.ERROR_REGISTRY_ONLY_PROTOCOL_UNPAUSER_ROLE),
    );

    await registry.connect(protocolUnpauser).unpause();
    expect(await registry.isProtocolPaused(), "wrong protocol paused state").to.be.false;
    expect(await registry.isProtocolPositionCreationPaused(), "wrong protocolPositionCreation paused state").to.be
      .false;
    await registry.connect(positionCreationPauser).pauseProtocolPositionCreation();

    expect(await registry.isProtocolPositionCreationPaused(), "wrong protocolPositionCreation paused state").to.be.true;

    await registry.connect(positionCreationPauser).pauseProtocolPositionCancellation();
    expect(await registry.isProtocolPositionCancellationPaused(), "wrong protocolPositionCreation paused state").to.be
      .true;
  },
});
