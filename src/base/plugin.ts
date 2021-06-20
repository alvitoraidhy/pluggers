import {
  undefinedPriority, pluginProps, errorTypes, CallbacksInterface, defaultCallbacks,
} from '../constants';

import { compareMetadata } from '../helpers';

import Base from './base';

export default class PluginBase extends Base {
  private [pluginProps] = {
    context: {} as { [key: string]: unknown },
    requiredPlugins: [] as Base['metadata'][],
    status: 'ready' as 'ready' | 'busy' | 'initialized' | 'crashed',
    state: null as unknown,
  };

  pluginConfig = {
    defaultPriority: undefinedPriority as unknown as number,
  };

  pluginCallbacks: CallbacksInterface = { ...defaultCallbacks };

  getContext() {
    return this[pluginProps].context;
  }

  getRequiredPlugins(): Base['metadata'][] {
    return this[pluginProps].requiredPlugins;
  }

  removeRequiredPlugin(name: string): this {
    const requiredPlugin = this[pluginProps].requiredPlugins.find((x) => x.name === name);
    if (requiredPlugin === undefined) {
      throw new errorTypes.RequirementError(`Plugin with the name "${name}" is not required`);
    }

    const index = this[pluginProps].requiredPlugins.indexOf(requiredPlugin);
    this[pluginProps].requiredPlugins.splice(index, 1);
    return this;
  }

  requirePlugin(metadata: Base['metadata']): this {
    if (this[pluginProps].requiredPlugins.some((x) => x.name === metadata.name)) {
      throw new errorTypes.ConflictError(`Plugin with the name "${metadata.name}" is already required`);
    }

    this[pluginProps].requiredPlugins.push({ ...metadata });
    return this;
  }

  requires(metadata: Base['metadata']) {
    const requiredPlugins = this.getRequiredPlugins();
    return requiredPlugins.some((x) => compareMetadata(x, metadata));
  }

  getState() {
    return this[pluginProps].state;
  }

  getStatus() {
    return this[pluginProps].status;
  }

  isInitialized() {
    return this.getStatus() === 'initialized';
  }
}
