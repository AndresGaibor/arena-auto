export enum BridgeErrorCode {
  ARENA_NOT_INSTALLED = "ARENA_NOT_INSTALLED",
  ARENA_NOT_OPEN = "ARENA_NOT_OPEN",
  MODEL_NOT_OPEN = "MODEL_NOT_OPEN",
  MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
  MODULE_NOT_FOUND = "MODULE_NOT_FOUND",
  PROPERTY_NOT_FOUND = "PROPERTY_NOT_FOUND",
  COM_ERROR = "COM_ERROR",
  TIMEOUT = "TIMEOUT",
  INVALID_PATH = "INVALID_PATH",
  INVALID_PARAMS = "INVALID_PARAMS",
  BRIDGE_DIED = "BRIDGE_DIED",
}

export class BridgeError extends Error {
  constructor(
    public code: BridgeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BridgeError";
  }
}

export function bridgeError(code: BridgeErrorCode, message: string): BridgeError {
  return new BridgeError(code, message);
}
