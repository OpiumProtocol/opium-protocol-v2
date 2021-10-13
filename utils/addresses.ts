import { ethers } from "hardhat";

export const formatAddress = (address: string): string => {
  return "0x".concat(address.split("0x000000000000000000000000")[1]);
};

export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const longExecutorRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LONG_EXECUTOR"));
export const shortExecutorRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SHORT_EXECUTOR"));
export const guardianRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GUARDIAN"));
