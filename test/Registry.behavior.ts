// theirs
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "./chai-setup";
// types
import { Registry } from "../typechain";
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
      await registry.hasRole(governanceRoles.executionReservePartSetterRole, authorized.address),
      "not executionReservePartSetterRole",
    ).to.be.true;
    expect(
      await registry.hasRole(governanceRoles.redemptionReservePartSetterRole, authorized.address),
      "not protocolAddressesSetterRole",
    ).to.be.true;
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
      await registry.hasRole(governanceRoles.redemptionReservePartSetterRole, authorized.address),
      "not redemptionReservePartSetterRole",
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
      await registry.hasRole(governanceRoles.executionReservePartSetterRole, notAuthorizedTwo.address),
      "wrong executionReservePartSetterRole",
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
    expect(protocolParams.derivativeAuthorExecutionFeeCap, "wrong derivativeAuthorExecutionFeeCap").to.be.eq(
      derivativeAuthorExecutionFeeCap,
    );
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
