/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */

import {
  undefinedPriority, pluginProps, errorTypes,
} from './constants';

import Base from './base';

class Plugin extends Base {
  private [pluginProps] = {
    pluginName: '' as string,
    context: {} as any,
    requiredPlugins: [] as string[],
  };

  pluginConfig = {
    metadata: {} as object,
    defaultPriority: undefinedPriority as unknown as number,
  };

  pluginCallbacks = {
    init: () => {},
    error: () => {},
    shutdown: () => {},
  } as {
    init: (pluginsStates: { [index: string]: any }) => any,
    error: (event: string, error: Error) => void,
    shutdown: (state: any) => void,
    [index: string]: (...arg: any) => any,
  };

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

  getRequiredPlugins(): string[] {
    return this[pluginProps].requiredPlugins;
  }

  removeRequiredPlugin(name: string): Plugin {
    const index = this[pluginProps].requiredPlugins.indexOf(name);
    if (!(index > -1)) {
      throw new errorTypes.RequirementError(`Plugin with the name "${name}" is not required`);
    }

    this[pluginProps].requiredPlugins.splice(index, 1);
    return this;
  }

  requirePlugin(name: string): Plugin {
    if (this[pluginProps].requiredPlugins.indexOf(name) > -1) {
      throw new errorTypes.ConflictError(`Plugin with the name "${name}" is already required`);
    }

    this[pluginProps].requiredPlugins.push(name);
    return this;
  }
}

export default Plugin;
