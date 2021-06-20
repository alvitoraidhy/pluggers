import flat from 'array.prototype.flat';
import {
  undefinedPriority, loaderProps, errorTypes,
} from '../constants';

import PluginBase from './plugin';

export interface PluginEntry {
  instance: PluginBase;
  priority: number;
}

export default class LoaderBase<T extends PluginBase> extends PluginBase {
  [loaderProps] = {
    pluginList: [] as PluginEntry[],
  };

  getPlugins(): T[] {
    return this[loaderProps].pluginList.map((x) => x.instance) as T[];
  }

  getPlugin(name: string): T | null {
    const plugin = this[loaderProps].pluginList.find((x) => x.instance.metadata.name === name);
    return plugin ? plugin.instance as T : null;
  }

  addPlugin(plugin: T, { priority = undefinedPriority } = {}): this {
    const { name } = plugin.metadata;
    if (this.getPlugin(name)) { // Name must be unique
      throw new errorTypes.ConflictError(`A plugin with the same name ('${name}') is already loaded`);
    }

    const newState: PluginEntry = {
      instance: plugin,
      priority: priority !== undefinedPriority ? priority : plugin.pluginConfig.defaultPriority,
    };

    this[loaderProps].pluginList.push(newState);
    return this;
  }

  removePlugin(plugin: T): this {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    if (plugin.isInitialized()) {
      throw new errorTypes.InitializeError('Plugin is initialized');
    }

    const newList = this[loaderProps].pluginList.filter((x) => x.instance !== plugin);
    this[loaderProps].pluginList = newList;
    return this;
  }

  getLoadOrder(): T[] {
    /*
    Flow of Process
    - Positive priorities will be processed first,
    - Undefined priorites will be processed before negative priorities, and then will be flatten
    - Negative priorities will be processed last
    */
    const { pluginList } = this[loaderProps];
    const priorities = pluginList.filter((x) => x.priority !== undefinedPriority).reduce(
      (acc: { [key: number]: PluginBase[] }, e: PluginEntry) => {
        if (!acc[e.priority]) acc[e.priority] = [];
        acc[e.priority].push(e.instance);
        return acc;
      }, {},
    );

    const keys = Object.keys(priorities).map((e) => Number(e));
    const positives = keys.filter((x) => x >= 0).sort((a, b) => a - b);
    const negatives = keys.filter((x) => x < 0).sort((a, b) => a - b);

    // Process positive numbers first
    const positiveArr = positives.map((x) => priorities[x]);

    // Process plugins with undefined priority
    const undefinedPriorities = pluginList.filter((x) => x.priority === undefinedPriority);
    const undefinedPriorityPlugins = undefinedPriorities.map((x) => x.instance);

    if (undefinedPriorityPlugins.length > 0) {
      positiveArr.push(undefinedPriorityPlugins);
    }

    // Process plugins with negative priority
    const arr: PluginBase[] = negatives.reduce((acc: any[], e) => {
      const index = acc.length + e + 1;
      acc.splice(index < 0 ? 0 : index, 0, priorities[e]);
      return acc;
    }, flat(positiveArr));

    return flat(arr) as T[];
  }

  sortLoadOrder(): this {
    const arr = this.getLoadOrder();

    // Bubble sort-ish algorithm
    for (let i = 0, len = arr.length; i < len; i += 1) {
      let sorted = false;
      while (!sorted) {
        sorted = true;
        const requiredPlugins = arr[i].getRequiredPlugins();
        for (let j = 0, reqLen = requiredPlugins.length; j < reqLen; j += 1) {
          const plugin = this.getPlugin(requiredPlugins[j].name);
          const index = plugin ? arr.indexOf(plugin) : -1;
          if (!(plugin && index > -1)) {
            throw new errorTypes.RequirementError(`Required plugin is not loaded -> '${requiredPlugins[j]}' (required by '${arr[i].metadata.name}')`);
          }

          if (i < index) {
            arr.splice(index, 1);
            arr.splice(i, 0, plugin);
            sorted = false;
          }
        }
      }
    }

    const { pluginList } = this[loaderProps];
    const newLoadOrder = arr.map((x) => pluginList.find((y) => y.instance === x)!);

    this[loaderProps].pluginList = newLoadOrder;

    return this;
  }

  hasLoaded(plugin: PluginBase): boolean {
    return this[loaderProps].pluginList.some((x) => x.instance === plugin);
  }
}
