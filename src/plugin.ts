/* eslint-disable max-classes-per-file */
import { Mutex } from 'async-mutex';

import {
  pluginProps, asyncProps, CallbacksInterface, defaultCallbacks, errorTypes, undefinedPriority,
  PluginConfigInterface,
} from './constants';

import Base from './base';
import { compareMetadata } from './helpers';

class PluginBase extends Base {
  private [pluginProps] = {
    context: {} as { [key: string]: unknown },
    requiredPlugins: [] as Base['metadata'][],
    status: 'ready' as 'ready' | 'busy' | 'initialized' | 'crashed',
    state: null as unknown,
  };

  /**
   * Plugin behavior configurations.
   *
   * @category Plugin
   */
  pluginConfig: PluginConfigInterface = {
    defaultPriority: undefinedPriority as unknown as number,
  };

  /**
   *
   * @category Plugin
   */
  pluginCallbacks: CallbacksInterface = { ...defaultCallbacks };

  /**
   * Returns the context of the instance.
   *
   * This context is exclusive to the instance only and directly mutable. Note that the context is
   * not the state of the instance. It is designed to be used internally by the instance.
   *
   * @category Plugin
   * @returns The context of the instance.
   */
  getContext() {
    return this[pluginProps].context;
  }

  /**
   * Returns the list of required plugins and their metadata.
   *
   * @category Plugin
   * @returns A list of metadata.
   */
  getRequiredPlugins(): Base['metadata'][] {
    return this[pluginProps].requiredPlugins;
  }

  /**
   * Removes a plugin from the instance's required plugins.
   *
   * @category Plugin
   * @param name - The name of the plugin.
   * @returns The current instance.
   */
  removeRequiredPlugin(name: string): this {
    const requiredPlugin = this[pluginProps].requiredPlugins.find((x) => x.name === name);
    if (requiredPlugin === undefined) {
      throw new errorTypes.RequirementError(`Plugin with the name "${name}" is not required`);
    }

    const index = this[pluginProps].requiredPlugins.indexOf(requiredPlugin);
    this[pluginProps].requiredPlugins.splice(index, 1);
    return this;
  }

  /**
   * Adds `metadata` as a required plugin for the instance.
   *
   * A loader will check if a plugin with the same metadata is loaded and initialized first before
   * trying to initialize the instance. The property `'version'` of `metadata` and its nested
   * objects supports [semantic versioning syntax](https://docs.npmjs.com/about-semantic-versioning).
   * @category Plugin
   * @param metadata - The metadata of the plugin.
   * @returns The current instance.
   */
  requirePlugin(metadata: Base['metadata']): this {
    if (this[pluginProps].requiredPlugins.some((x) => x.name === metadata.name)) {
      throw new errorTypes.ConflictError(`Plugin with the name "${metadata.name}" is already required`);
    }

    this[pluginProps].requiredPlugins.push({ ...metadata });
    return this;
  }

  /**
   * Checks whether the instance requires a plugin or not.
   *
   * @category Plugin
   * @param metadata - The metadata of the plugin.
   * @returns `true` if the instance requires the plugin, `false` if not.
   */
  requires(metadata: Base['metadata']) {
    const requiredPlugins = this.getRequiredPlugins();
    return requiredPlugins.some((x) => compareMetadata(x, metadata));
  }

  /**
   * Returns the state of the instance
   *
   * @category Plugin
   */
  getState() {
    return this[pluginProps].state;
  }

  /**
   * Returns the status of the instance
   *
   * @category Plugin
   */
  getStatus() {
    return this[pluginProps].status;
  }

  /**
   * Returns whether the instance is initialized or not.
   *
   * @category Plugin
   */
  isInitialized() {
    return this.getStatus() === 'initialized';
  }
}

export default class Plugin extends PluginBase {
  private [asyncProps] = {
    mutex: new Mutex(),
  };

  /**
   * Runs the `init` callback function.
   *
   * @category Plugin
   */
  async selfInit(pluginsStates?: Parameters<this['pluginCallbacks']['init']>[0]): Promise<this> {
    try {
      this[pluginProps].status = 'busy';
      this[pluginProps].state = await this.pluginCallbacks.init(pluginsStates);
      this[pluginProps].status = 'initialized';
    } catch (err) {
      const result = await this.pluginCallbacks.error('init', err);
      this[pluginProps].status = result ? 'crashed' : 'ready';
      if (result !== null) throw result;
    }

    return this;
  }

  /**
   * Runs the `shutdown` callback function.
   *
   * @category Plugin
   */
  async selfShutdown(): Promise<this> {
    const { state } = this[pluginProps];
    try {
      this[pluginProps].status = 'busy';
      await this.pluginCallbacks.shutdown(state);
      this[pluginProps].state = null;
      this[pluginProps].status = 'ready';
    } catch (err) {
      const result = await this.pluginCallbacks.error('shutdown', err);
      this[pluginProps].status = result ? 'crashed' : 'ready';
      if (result !== null) throw result;
    }

    return this;
  }

  /**
   *
   * @internal
   * @category Plugin
   * @param func - Function to be run subsequently.
   * @returns The return value of the function
   */
  createSession(func: () => Promise<unknown> | unknown) {
    return this[asyncProps].mutex.runExclusive(func);
  }
}
