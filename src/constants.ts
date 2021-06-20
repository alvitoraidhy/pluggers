/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
export const undefinedPriority: number = Symbol.for('undefinedPriority') as unknown as number; // Must be JSON-safe
export const pluginProps: unique symbol = Symbol.for('pluginProps');
export const loaderProps: unique symbol = Symbol.for('loaderProps');
export const pluggerProps: unique symbol = Symbol.for('pluggerProps');
export const asyncProps: unique symbol = Symbol.for('asyncProps');
export interface CallbacksInterface {
  init: (pluginsStates?: { [key: string]: any }) => unknown;
  error: (event: string, error: Error) => Promise<Error> | Promise<null> | Error | null;
  shutdown: (state: any) => Promise<void> | void;
}
export const defaultCallbacks: CallbacksInterface = {
  init: () => {},
  error: (event: string, error: Error) => error,
  shutdown: () => {},
};
export const errorTypes = {
  RequirementError: class RequirementError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RequirementError';
      Object.setPrototypeOf(this, RequirementError.prototype);
    }
  },
  ConflictError: class ConflictError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ConflictError';
      Object.setPrototypeOf(this, ConflictError.prototype);
    }
  },
  LoadError: class LoadError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LoadError';
      Object.setPrototypeOf(this, LoadError.prototype);
    }
  },
  InitializeError: class InitializeError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InitializeError';
      Object.setPrototypeOf(this, InitializeError.prototype);
    }
  },
};
