/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
export const undefinedPriority: number = Symbol.for('undefinedPriority') as unknown as number; // Must be JSON-safe
export const pluginProps: unique symbol = Symbol.for('pluginProps');
export const loaderProps: unique symbol = Symbol.for('loaderProps');
export interface CallbacksInterface {
  init: (pluginsStates: { [index: string]: any }) => any;
  error: (event: string, error: Error) => Error | null;
  shutdown: (state: any) => void;
}
export const defaultCallbacks: CallbacksInterface = {
  init: () => {},
  error: (event:string, error: Error) => error,
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
  IgnoreError: class IgnoreError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'IgnoreError';
      Object.setPrototypeOf(this, IgnoreError.prototype);
    }
  },
};
