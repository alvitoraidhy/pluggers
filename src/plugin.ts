/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */

import {
  undefinedPriority, pluginProps, errorTypes, CallbacksInterface, defaultCallbacks,
} from './constants';

import Base from './base';

class Plugin extends Base {
  private [pluginProps] = {
    pluginName: '' as string,
    context: {} as object,
    requiredPlugins: [] as {name: string, [key: string]: any}[],
  };

  pluginConfig = {
    metadata: {} as object,
    defaultPriority: undefinedPriority as unknown as number,
  };

  pluginCallbacks: CallbacksInterface = {
    init: defaultCallbacks.init,
    error: defaultCallbacks.error,
    shutdown: defaultCallbacks.shutdown,
  }

  constructor(name: string) {
    super();
    this[pluginProps].pluginName = name;
  }

  getName(): string {
    return this[pluginProps].pluginName;
  }

  getContext(): any {
    return this[pluginProps].context;
  }

  getRequiredPlugins(): { name: string, [key: string]: string }[] {
    return this[pluginProps].requiredPlugins;
  }

  removeRequiredPlugin(name: string): Plugin {
    const requiredPlugin = this[pluginProps].requiredPlugins.find((x) => x.name === name);
    if (requiredPlugin === undefined) {
      throw new errorTypes.RequirementError(`Plugin with the name "${name}" is not required`);
    }

    const index = this[pluginProps].requiredPlugins.indexOf(requiredPlugin);
    this[pluginProps].requiredPlugins.splice(index, 1);
    return this;
  }

  requirePlugin(name: string, metadata: object = {}): Plugin {
    if (this[pluginProps].requiredPlugins.some((x) => x.name === name)) {
      throw new errorTypes.ConflictError(`Plugin with the name "${name}" is already required`);
    }

    this[pluginProps].requiredPlugins.push({ ...metadata, name });
    return this;
  }
}

export default Plugin;
