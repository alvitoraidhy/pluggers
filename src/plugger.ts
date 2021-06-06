/* eslint-disable max-classes-per-file */
/* eslint-disable no-unused-vars */
import {
  undefinedPriority, loaderProps, errorTypes,
} from './constants';

import Plugin from './plugin';

interface PluginState {
  instance: Plugin;
  isInitialized: boolean;
  state: any;
  priority: number;
}

class Plugger extends Plugin {
  [loaderProps] = {
    pluginList: [] as PluginState[],
  };

  loaderConfig = {
    autoInit: true as boolean,
  };

  constructor(name: string) {
    super(name);

    const self = this;

    process.on('exit', () => { self.shutdownAll(); });
  }

  getPlugins(): { [key: string]: Plugin } {
    const plugins = this[loaderProps].pluginList.reduce(
      (acc: { [key: string]: Plugin }, plugin: PluginState) => {
        acc[plugin.instance.getName()] = plugin.instance;
        return acc;
      }, {},
    );
    return plugins;
  }

  getPlugin(name: string): Plugin | null {
    const plugin = this[loaderProps].pluginList.find((x) => x.instance.getName() === name);
    return plugin ? plugin.instance : null;
  }

  getStates(): PluginState[] {
    return this[loaderProps].pluginList;
  }

  getState(plugin: Plugin): PluginState {
    const state = this[loaderProps].pluginList.find((x) => x.instance === plugin);

    if (!state) {
      throw new errorTypes.NotLoadedError('Plugin is not loaded');
    }

    return state;
  }

  addPlugin(plugin: Plugin, { priority = undefinedPriority } = {}): Plugger {
    const name = plugin.getName();
    if (this.getPlugin(name)) { // Name must be unique
      throw new errorTypes.ConflictError(`A plugin with the same name (${name}) is already loaded`);
    }

    const newState = {
      instance: plugin,
      priority: priority !== undefinedPriority ? priority : plugin.pluginConfig.defaultPriority,
      isInitialized: false,
      state: null,
    };

    this[loaderProps].pluginList.push(newState);
    if (this.loaderConfig.autoInit) this.initPlugin(plugin);
    return this;
  }

  removePlugin(plugin: Plugin): Plugger {
    const state = this.getStates().find((x) => x.instance === plugin);
    if (!state) {
      throw new errorTypes.NotLoadedError('Plugin is not loaded');
    }

    this[loaderProps].pluginList.splice(this[loaderProps].pluginList.indexOf(state), 1);
    return this;
  }

  getLoadOrder(): Plugin[] {
    /*
    Flow of Process
    - Positive priorities will be processed first,
    - Undefined priorites will be processed before negative priorities, and then will be flatten
    - Negative priorities will be processed last
    */
    const states = this.getStates();
    const priorities = states.filter((x) => x.priority !== undefinedPriority).reduce(
      (acc: { [key: number]: Plugin[] }, e: PluginState) => {
        const key = e.priority;
        if (!(Object.keys(acc).indexOf(String(key)) > -1)) acc[key] = [];
        acc[key].push(e.instance);
        return acc;
      }, {},
    );

    const keys = Object.keys(priorities).map((e) => Number(e));
    const positives = keys.filter((x) => x >= 0).sort((a, b) => a - b);
    const negatives = keys.filter((x) => x < 0).sort((a, b) => a - b);

    // Process positive numbers first
    const positiveArr = positives.reduce(
      (acc: Plugin[][], e) => {
        acc.push(priorities[e]);
        return acc;
      }, [],
    );

    // Process plugins with undefined priority
    const undefinedPriorities = states.filter((x) => x.priority === undefinedPriority);
    const undefinedPriorityPlugins = undefinedPriorities.reduce(
      (acc: Plugin[], e) => {
        acc.push(e.instance);
        return acc;
      }, [],
    );

    if (undefinedPriorityPlugins.length > 0) {
      positiveArr.push(undefinedPriorityPlugins);
    }

    // Process plugins with negative priority
    const arr: Plugin[] = negatives.reduce((acc: any[], e) => {
      const index = acc.length + e + 1;
      acc.splice(index < 0 ? 0 : index, 0, priorities[e]);
      return acc;
    }, positiveArr.flat()).flat();

    return arr;
  }

  sortLoadOrder(): any {
    const arr = this.getLoadOrder();

    // Bubble sort-ish algorithm
    for (let i = 0, len = arr.length; i < len; i += 1) {
      let sorted = false;
      while (!sorted) {
        sorted = true;
        const requiredPlugins = arr[i].getRequiredPlugins();
        for (let j = 0, reqLen = requiredPlugins.length; j < reqLen; j += 1) {
          const plugin = this.getPlugin(requiredPlugins[j]);
          const index = plugin ? arr.indexOf(plugin) : -1;
          if (!(plugin && index > -1)) {
            throw new errorTypes.RequirementError(`Required plugin is not loaded -> '${requiredPlugins[j]}' (required by '${arr[i].getName()}')`);
          }

          if (i < index) {
            arr.splice(index, 1);
            arr.splice(i, 0, plugin);
            sorted = false;
          }
        }
      }
    }

    const newLoadOrder: PluginState[] = [];
    for (let i = 0, len = arr.length; i < len; i += 1) {
      newLoadOrder.push(this.getState(arr[i]));
    }

    this[loaderProps].pluginList = newLoadOrder;

    return this;
  }

  initPlugin(plugin: Plugin): any {
    /*
      We use getState and not getPlugin here because there's a chance that 'plugin'
      has the same name with one of the plugins loaded, but not that exact plugin.
    */
    const state = this.getState(plugin);

    const pluginsStates: { [key: string]: PluginState['state'] } = {};
    const requiredList = plugin.getRequiredPlugins();
    for (let x = 0, len = requiredList.length; x < len; x += 1) {
      const requiredPluginName = requiredList[x];
      const requiredPlugin = this.getPlugin(requiredPluginName);
      if (!requiredPlugin) {
        throw new errorTypes.RequirementError(`Required plugin is not loaded -> '${requiredPluginName}' (required by '${plugin.getName()}')`);
      }

      const requiredPluginState = this.getState(requiredPlugin);
      if (!requiredPluginState.isInitialized) {
        throw new errorTypes.NotInitializedError(`Required plugin is not initialized -> '${requiredPluginName}' (required by '${plugin.getName()}')`);
      }

      pluginsStates[requiredPlugin.getName()] = requiredPluginState.state;
    }

    try {
      const result = plugin.pluginCallbacks.init(pluginsStates);
      state.state = result;
      state.isInitialized = true;
      return this;
    } catch (err) {
      plugin.pluginCallbacks.error('init', err);
      throw err;
    }
  }

  initAll(): any {
    const loadOrder = this.getLoadOrder();
    for (let x = 0, len = loadOrder.length; x < len; x += 1) {
      this.initPlugin(loadOrder[x]);
    }
    return this;
  }

  shutdownPlugin(plugin: Plugin): any {
    const pluginState = this.getState(plugin);

    if (!pluginState.isInitialized) {
      throw new errorTypes.NotInitializedError(`Plugin is not initialized: ${pluginState.instance.getName()}`);
    }

    try {
      pluginState.instance.pluginCallbacks.shutdown(pluginState.state);
      pluginState.state = null;
      pluginState.isInitialized = false;

      return this;
    } catch (err) {
      plugin.pluginCallbacks.error('shutdown', err);
      throw err;
    }
  }

  shutdownAll(): any {
    const loadOrder = this.getLoadOrder().reverse();
    for (let x = 0, len = loadOrder.length; x < len; x += 1) {
      const plugin = loadOrder[x];
      if (this.getState(plugin).isInitialized) {
        this.shutdownPlugin(loadOrder[x]);
      }
    }
    return this;
  }
}

export default Plugger;
