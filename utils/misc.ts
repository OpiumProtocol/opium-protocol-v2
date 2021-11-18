import { protocolErrors, semanticErrors } from "./constants";

export const formatAddress = (address: string): string => {
  return "0x".concat(address.split("0x000000000000000000000000")[1]);
};

export const pickError = (
  semanticError: typeof semanticErrors[keyof typeof semanticErrors],
): typeof protocolErrors[keyof typeof semanticErrors] => {
  return protocolErrors[semanticError];
};
