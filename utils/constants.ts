export const zeroAddress = "0x0000000000000000000000000000000000000000";

export const AUTHOR_COMMISSION = 0.0025; // 0.25%
export const OPIUM_COMMISSION = 0.1; // 10% of author commission
export const SECONDS_10_MINS = 60 * 10;
export const SECONDS_20_MINS = 60 * 20;
export const SECONDS_30_MINS = 60 * 30;
export const SECONDS_40_MINS = 60 * 40;
export const SECONDS_50_MINS = 60 * 50;
export const SECONDS_3_WEEKS = 60 * 60 * 24 * 7 * 3;
export const SECONDS_2_WEEKS = 60 * 60 * 24 * 7 * 2;

export const semanticErrors = {
  ERROR_CORE_ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH: "ERROR_CORE_ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH",
  ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED: "ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED",
  ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED: "ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED",
  ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE: "ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE",
  ERROR_CORE_CANCELLATION_IS_NOT_ALLOWED: "ERROR_CORE_CANCELLATION_IS_NOT_ALLOWED",
  ERROR_CORE_INSUFFICIENT_P2P_BALANCE: "ERROR_CORE_INSUFFICIENT_P2P_BALANCE",
  ERROR_CORE_TICKER_WAS_CANCELLED: "ERROR_CORE_TICKER_WAS_CANCELLED",
  ERROR_ORACLE_AGGREGATOR_DATA_DOESNT_EXIST: "ERROR_ORACLE_AGGREGATOR_DATA_DOESNT_EXIST",
  ERROR_ORACLE_AGGREGATOR_DATA_ALREADY_EXIST: "ERROR_ORACLE_AGGREGATOR_DATA_ALREADY_EXIST",
  ERROR_CORE_WRONG_HASH: "WRONG_HASH",
  ERROR_CORE_WRONG_POSITION_TYPE: "WRONG_POSITION_TYPE",
  ERROR_CORE_NOT_ENOUGH_POSITIONS: "NOT_ENOUGH_POSITIONS",
  ERROR_CORE_WRONG_MOD: "WRONG_MOD",
  ERROR_CORE_CANT_CANCEL_DUMMY_ORACLE_ID: "ERROR_CORE_CANT_CANCEL_DUMMY_ORACLE_ID",
  ERROR_CORE_SYNTHETIC_VALIDATION_ERROR: "ERROR_CORE_SYNTHETIC_VALIDATION_ERROR",
  ERROR_SYNTHETIC_AGGREGATOR_DERIVATIVE_HASH_NOT_MATCH: "ERROR_SYNTHETIC_AGGREGATOR_DERIVATIVE_HASH_NOT_MATCH",
  ERROR_SYNTHETIC_AGGREGATOR_WRONG_MARGIN: "ERROR_SYNTHETIC_AGGREGATOR_WRONG_MARGIN",
  ERROR_REGISTRY_ONLY_PARAMETER_SETTER_ROLE: "ERROR_REGISTRY_ONLY_PARAMETER_SETTER_ROLE",
  ERROR_REGISTRY_ONLY_PROTOCOL_REGISTER_ROLE: "ERROR_REGISTRY_ONLY_PROTOCOL_REGISTER_ROLE",
  ERROR_REGISTRY_ONLY_WHITELISTER_ROLE: "ERROR_REGISTRY_ONLY_WHITELISTER_ROLE",
  ERROR_REGISTRY_ONLY_GUARDIAN: "ERROR_REGISTRY_ONLY_GUARDIAN",
  ERROR_REGISTRY_NULL_PROTOCOL_ADDRESS: "ERROR_REGISTRY_NULL_PROTOCOL_ADDRESS",
  ERROR_REGISTRY_ALREADY_PAUSED: "ERROR_REGISTRY_ALREADY_PAUSED",
  ERROR_REGISTRY_NOT_PAUSED: "ERROR_REGISTRY_NOT_PAUSED",
  ERROR_OPIUM_POSITION_TOKEN_NOT_FACTORY: "ERROR_OPIUM_POSITION_TOKEN_NOT_FACTORY",
  ERROR_OPIUM_PROXY_FACTORY_NOT_CORE: "ERROR_OPIUM_PROXY_FACTORY_NOT_CORE",
  ERROR_OPIUM_POSITION_TOKEN_ALREADY_DEPLOYED: "ERROR_OPIUM_POSITION_TOKEN_ALREADY_DEPLOYED",
  ERROR_TOKEN_SPENDER_NOT_WHITELISTED: "ERROR_TOKEN_SPENDER_NOT_WHITELISTED",
  ERROR_CORE_NOT_OPIUM_FACTORY_POSITIONS: "ERROR_CORE_NOT_OPIUM_FACTORY_POSITIONS"
};

export const protocolErrors = {
  [semanticErrors.ERROR_CORE_ADDRESSES_AND_AMOUNTS_DO_NOT_MATCH]: "C1",
  [semanticErrors.ERROR_CORE_WRONG_HASH]: "C2",
  [semanticErrors.ERROR_CORE_WRONG_POSITION_TYPE]: "C3",
  [semanticErrors.ERROR_CORE_NOT_ENOUGH_POSITIONS]: "C4",
  [semanticErrors.ERROR_CORE_WRONG_MOD]: "C5",
  [semanticErrors.ERROR_CORE_CANT_CANCEL_DUMMY_ORACLE_ID]: "C6",
  [semanticErrors.ERROR_CORE_TICKER_WAS_CANCELLED]: "C7",
  [semanticErrors.ERROR_CORE_SYNTHETIC_VALIDATION_ERROR]: "C8",
  [semanticErrors.ERROR_CORE_INSUFFICIENT_P2P_BALANCE]: "C9",
  [semanticErrors.ERROR_CORE_EXECUTION_BEFORE_MATURITY_NOT_ALLOWED]: "C10",
  [semanticErrors.ERROR_CORE_SYNTHETIC_EXECUTION_WAS_NOT_ALLOWED]: "C11",
  [semanticErrors.ERROR_CORE_NOT_ENOUGH_TOKEN_ALLOWANCE]: "C12",
  [semanticErrors.ERROR_CORE_CANCELLATION_IS_NOT_ALLOWED]: "C13",
  [semanticErrors.ERROR_CORE_NOT_OPIUM_FACTORY_POSITIONS]: "C14",
  [semanticErrors.ERROR_ORACLE_AGGREGATOR_DATA_ALREADY_EXIST]: "O1",
  [semanticErrors.ERROR_ORACLE_AGGREGATOR_DATA_DOESNT_EXIST]: "O2",
  [semanticErrors.ERROR_SYNTHETIC_AGGREGATOR_DERIVATIVE_HASH_NOT_MATCH]: "S1",
  [semanticErrors.ERROR_SYNTHETIC_AGGREGATOR_WRONG_MARGIN]: "S2",
  [semanticErrors.ERROR_REGISTRY_ONLY_PROTOCOL_REGISTER_ROLE]: "R1",
  [semanticErrors.ERROR_REGISTRY_ONLY_GUARDIAN]: "R2",
  [semanticErrors.ERROR_REGISTRY_ONLY_WHITELISTER_ROLE]: "R3",
  [semanticErrors.ERROR_REGISTRY_ONLY_PARAMETER_SETTER_ROLE]: "R4",
  [semanticErrors.ERROR_REGISTRY_NULL_PROTOCOL_ADDRESS]: "R5",
  [semanticErrors.ERROR_REGISTRY_ALREADY_PAUSED]: "R6",
  [semanticErrors.ERROR_REGISTRY_NOT_PAUSED]: "R7",
  [semanticErrors.ERROR_OPIUM_POSITION_TOKEN_NOT_FACTORY]: "P1",
  [semanticErrors.ERROR_OPIUM_POSITION_TOKEN_ALREADY_DEPLOYED]: "F1",
  [semanticErrors.ERROR_OPIUM_PROXY_FACTORY_NOT_CORE]: "F2",
  [semanticErrors.ERROR_TOKEN_SPENDER_NOT_WHITELISTED]: "T1",
};

export const pickError = (
  semanticError: typeof semanticErrors[keyof typeof semanticErrors],
): typeof protocolErrors[keyof typeof semanticErrors] => {
  return protocolErrors[semanticError];
};
