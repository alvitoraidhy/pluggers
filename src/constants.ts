/* eslint-disable max-classes-per-file */
export const undefinedPriority: number = Symbol.for('undefinedPriority') as unknown as number; // Must be JSON-safe
export const pluginProps: unique symbol = Symbol.for('pluginProps');
export const loaderProps: unique symbol = Symbol.for('loaderProps');
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
  NotLoadedError: class NotLoadedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotLoadedError';
      Object.setPrototypeOf(this, NotLoadedError.prototype);
    }
  },
  NotInitializedError: class NotInitializedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotInitializedError';
      Object.setPrototypeOf(this, NotInitializedError.prototype);
    }
  },
};
