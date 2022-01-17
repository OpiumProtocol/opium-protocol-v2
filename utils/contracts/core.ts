import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { BigNumber, Contract, ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { Core, IERC20 } from "../../typechain";
import { TDerivative } from "../../types";
import { computeDerivativeMargin } from "../derivatives";

class CoreContract {
  private _core: Core;
  private _deployer: SignerWithAddress;
  constructor(_core: Core, _deployer: SignerWithAddress) {
    this._core = _core;
    this._deployer = _deployer;
  }
  public async create(
    _derivative: TDerivative,
    _amount: BigNumber,
    _positionsOwners: [string, string],
    _marginToken: IERC20,
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    const tokenSpenderAddress = await this._core.getProtocolAddresses()
    await _marginToken.connect(_caller || this._deployer).approve(tokenSpenderAddress.tokenSpender,computeDerivativeMargin(_derivative.margin, _amount));
    return this._core.connect(_caller || this._deployer).create(_derivative, _amount, _positionsOwners);
  }
  public async createAndMint(
    _derivative: TDerivative,
    _amount: BigNumber,
    _positionsOwners: [string, string],
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core.connect(_caller || this._deployer).createAndMint(_derivative, _amount, _positionsOwners);
  }
  public async mint(
    _amount: BigNumber,
    _positionsAddresses: [string, string],
    _positionsOwners: [string, string],
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core.connect(_caller || this._deployer).mint(_amount, _positionsAddresses, _positionsOwners);
  }
  public async redeem(
    _amount: BigNumber,
    _positionsAddresses: [string, string],
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core.connect(_caller || this._deployer)["redeem(address[2],uint256)"](_positionsAddresses, _amount);
  }
  public async redeemMany(
    _amounts: BigNumber[],
    _positionsAddresses: [string, string][],
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core
      .connect(_caller || this._deployer)
      ["redeem(address[2][],uint256[])"](_positionsAddresses, _amounts);
  }
  public async executeOne(
    _amount: BigNumber,
    _positionAddress: string,
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core.connect(_caller || this._deployer)["execute(address,uint256)"](_positionAddress, _amount);
  }
  public async executeOneWithAddress(
    positionOwner: string,
    _amount: BigNumber,
    _positionAddress: string,
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core
      .connect(_caller || this._deployer)
      ["execute(address,address,uint256)"](positionOwner, _positionAddress, _amount);
  }
  public async executeMany(
    _amounts: BigNumber[],
    _positionsAddresses: string[],
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core.connect(_caller || this._deployer)["execute(address[],uint256[])"](_positionsAddresses, _amounts);
  }
  public async executeManyWithAddress(
    _positionOwner: string,
    _amounts: BigNumber[],
    _positionsAddresses: string[],
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core
      .connect(_caller || this._deployer)
      ["execute(address,address[],uint256[])"](_positionOwner, _positionsAddresses, _amounts);
  }
  public async cancelOne(
    _positionAddress: string,
    _amount: BigNumber,
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core.connect(_caller || this._deployer)["cancel(address,uint256)"](_positionAddress, _amount);
  }
  public async cancelMany(
    _amounts: BigNumber[],
    _positionsAddresses: string[],
    _caller?: SignerWithAddress,
  ): Promise<ContractTransaction> {
    return this._core.connect(_caller || this._deployer)["cancel(address[],uint256[])"](_positionsAddresses, _amounts);
  }
}

export default CoreContract;
