/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
export const undefinedPriority: number = Symbol.for(
  "undefinedPriority"
) as unknown as number; // Must be JSON-safe
export const pluggerIdentifier: unique symbol = Symbol.for("pluggerIdentifier");
export const pluginProps: unique symbol = Symbol.for("pluginProps");
export const loaderProps: unique symbol = Symbol.for("loaderProps");
export const listenerProps: unique symbol = Symbol.for("listenerProps");
export const asyncProps: unique symbol = Symbol.for("asyncProps");

/**
 * Plugin behaviour configuration interface.
 */
export interface PluginConfigInterface {
  /**
   * The default priority of the plugin.
   *
   * This property can be used when a plugin is designed to always be loaded at a specific step of
   * an app (ex: designed to be loaded first as a core plugin or loaded last as the app runner).
   */
  defaultPriority: number;
}

/**
 * Callbacks used by the plugin
 */
export interface CallbacksInterface {
  /**
   * The callback to be run when the instance is initializing.
   *
   * This callback function will be passed 1 argument, which is an `Object` that contains the
   * state(s) of the instance's required plugin(s) with their names as their respective keys.
   * The return value of the callback will be stored by the loader as the 'state' of the plugin.
   * This state will be passed to any other plugins that has the plugin's name as a requirement.
   *
   * @param pluginsStates - The state(s) of the instance's required plugin(s).
   * @returns The plugin's state.
   */
  init: (pluginsStates: any) => unknown;

  /**
   * The callback to be run when the instance encounters an uncaught error when running any of the
   * other callbacks.
   *
   * `event` is the event type of the callback that throws the error. `error` is the error instance.
   * This callback function should either return an `Error` instance that will be thrown by the
   * loader, or `null` to ignore the error entirely and let the whole program continue.
   *
   * @param event - The event type of the callback.
   * @param error - The error instance that was thrown.
   * @returns An error instance, or null to ignore the error.
   */
  error: (
    event: string,
    error: Error
  ) => Promise<Error> | Promise<null> | Error | null;

  /**
   * The callback to be run when the instance is shutting down.
   *
   * `state` is the state of the plugin that is shutting down. This callback does not need to return
   * a value.
   *
   * @param state - The state of the plugin.
   */
  shutdown: (state: any) => Promise<void> | void;
}

export const defaultCallbacks: CallbacksInterface = {
  init: () => null,
  error: (event: string, error: Error) => error,
  shutdown: () => {
    /* placeholder function */
  },
};

export const errorTypes = {
  RequirementError: class RequirementError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "RequirementError";
      Object.setPrototypeOf(this, RequirementError.prototype);
    }
  },
  ConflictError: class ConflictError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ConflictError";
      Object.setPrototypeOf(this, ConflictError.prototype);
    }
  },
  LoadError: class LoadError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "LoadError";
      Object.setPrototypeOf(this, LoadError.prototype);
    }
  },
  InitializeError: class InitializeError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "InitializeError";
      Object.setPrototypeOf(this, InitializeError.prototype);
    }
  },
};
