import { TDerivative } from ".";

export {};

declare global {
  export namespace Chai {
    interface Assertion {
      matchDerivative(expectedDerivative: TDerivative): void;
    }
  }
}
