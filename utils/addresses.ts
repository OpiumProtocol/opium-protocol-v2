import { ethers } from "hardhat";

export const formatAddress = (address: string): string => {
  return "0x".concat(address.split("0x000000000000000000000000")[1]);
};

export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const protocolRegisterRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROTOCOL_REGISTER_ROLE"));
export const guardianRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GUARDIAN_ROLE"));
export const whitelisterRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WHITELISTER_ROLE"));
export const commissionSetterRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("COMMISSION_SETTER_ROLE"));
