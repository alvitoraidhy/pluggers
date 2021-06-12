/* eslint-disable no-unused-vars */
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import semver from 'semver';
import callsites from 'callsites';
import jsonfile from 'jsonfile';
import {
  undefinedPriority, loaderProps, errorTypes, CallbacksInterface,
} from './constants';

import Plugin from './plugin';

const exitEvents = ['exit', 'SIGINT', 'SIGTERM', 'SIGQUIT'];

const wrappedFunction = (
  instance: Plugin, event: string, func: (plugin: Plugin) => any, errorHandler: CallbacksInterface['error'],
): any => {
  try {
    return func(instance);
  } catch (err) {
    const result = errorHandler.call(instance, event, err);
    throw result !== null ? result : new errorTypes.IgnoreError('Error ignored');
  }
};

const compareMetadata = (requiredMetadata: any, loadedMetadata: any): boolean => {
  // ref: https://medium.com/swlh/ways-to-compare-value-or-object-equality-in-javascript-71551c6f7cf6
  let result = true;
  const keys = Object.keys(requiredMetadata);
  for (let i = 0, len = keys.length; i < len; i += 1) {
    const k = keys[i];
    switch (k) {
      case 'version':
        // semver.satisfies(loadedVersion, requiredVersion)
        result = semver.satisfies(loadedMetadata[k], requiredMetadata[k]);
        break;
      default:
        if (typeof requiredMetadata[k] !== 'object') {
          result = requiredMetadata[k] === loadedMetadata[k];
        } else {
          result = compareMetadata(requiredMetadata[k], loadedMetadata[k]);
        }
        break;
    }

    if (result === false) break;
  }
  return result;
};

interface PluginState {
  instance: Plugin;
  isInitialized: boolean;
  state: any;
  priority: number;
  requires: PluginState[];
}

class Plugger extends Plugin {
  [loaderProps] = {
    pluginList: [] as PluginState[],
    useExitListener: false as boolean,
    exitListener: null as (() => void) | null,
  };

  static fromJsonFile(jsonFile = 'package.json', props: string[] | null = null) {
    const cs = callsites();
    const dirPath = path.dirname(cs[1].getFileName()!);
    const filePath = path.resolve(dirPath, jsonFile);

    const { name, pluginConfig, ...data }: {
      name: string,
      defaultPriority: number,
      [key: string]: any,
    } = jsonfile.readFileSync(filePath);

    const metadata = props !== null ? props.reduce((
      acc: { [key: string]: string }, e: string,
    ) => {
      acc[e] = data[e];
      return acc;
    }, {}) : data;

    const instance = new Plugger(name);
    instance.pluginConfig.metadata = metadata;

    return instance;
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

  getState(plugin: Plugin): PluginState | null {
    const state = this[loaderProps].pluginList.find((x) => x.instance === plugin);
    return state || null;
  }

  addPlugin(plugin: Plugin, { priority = undefinedPriority } = {}): Plugger {
    const name = plugin.getName();
    if (this.getPlugin(name)) { // Name must be unique
      throw new errorTypes.ConflictError(`A plugin with the same name ('${name}') is already loaded`);
    }

    const newState: PluginState = {
      instance: plugin,
      priority: priority !== undefinedPriority ? priority : plugin.pluginConfig.defaultPriority,
      isInitialized: false,
      state: null,
      requires: [] as PluginState[],
    };

    this[loaderProps].pluginList.push(newState);
    return this;
  }

  removePlugin(plugin: Plugin): Plugger {
    const state = this.getState(plugin);

    if (!state) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    const states = this.getStates();
    const requiredBy = states.filter((x) => x.requires.indexOf(state) > -1);
    if (requiredBy.length > 0) {
      const names = requiredBy.reduce(
        (acc: string[], e) => {
          acc.push(e.instance.getName());
          return acc;
        }, [],
      );
      throw new errorTypes.RequirementError(`Plugin is required by ${requiredBy.length} initialized plugins: ${names}`);
    }

    if (state.isInitialized) {
      this.shutdownPlugin(state.instance);
    }

    this[loaderProps].pluginList.splice(this[loaderProps].pluginList.indexOf(state), 1);
    return this;
  }

  addFolder(dir: string): Plugger {
    const cs = callsites();
    const dirPath = path.dirname(cs[1].getFileName()!);
    const fullPath = path.resolve(dirPath, dir);

    fs.accessSync(path.join(fullPath, '/'));

    glob.sync(path.join(fullPath, '*/index.!(d.ts)'), { strict: true }).forEach((pluginPath: string) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const plugin = require(pluginPath);

      if (plugin instanceof Plugin) this.addPlugin(plugin);
      else if (plugin.default instanceof Plugin) this.addPlugin(plugin.default);
    });

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
        if (!(Object.keys(acc).includes(String(key)))) acc[key] = [];
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

  sortLoadOrder(): Plugger {
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
      newLoadOrder.push(this.getState(arr[i]) as PluginState);
    }

    this[loaderProps].pluginList = newLoadOrder;

    return this;
  }

  initPlugin(plugin: Plugin): Plugger {
    const state = this.getState(plugin);

    if (!state) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    if (state.isInitialized) {
      throw new errorTypes.InitializeError('Plugin is already initialized');
    }

    const pluginsStates: { [key: string]: PluginState['state'] } = {};
    const requiredList = plugin.getRequiredPlugins();
    const requiredStates: PluginState[] = [];
    for (let x = 0, len = requiredList.length; x < len; x += 1) {
      const { name, ...metadata } = requiredList[x];
      const requiredPlugin = this.getPlugin(name);
      if (!requiredPlugin) {
        throw new errorTypes.RequirementError(`Required plugin is not loaded -> '${name}' (required by '${plugin.getName()}')`);
      }

      const loadedMetadata = requiredPlugin.pluginConfig.metadata;
      if (!compareMetadata(metadata, loadedMetadata)) {
        throw new errorTypes.RequirementError(`
          Required plugin's metadata does not match loaded plugin's metadata (required by '${plugin.getName()}')\n
          Required plugin: ${JSON.stringify(metadata)}\n
          Loaded plugin: ${JSON.stringify(loadedMetadata)}
        `);
      }

      const requiredPluginState = this.getState(requiredPlugin) as PluginState;
      if (!requiredPluginState.isInitialized) {
        throw new errorTypes.RequirementError(`Required plugin is not initialized -> '${name}' (required by '${plugin.getName()}')`);
      }

      pluginsStates[requiredPlugin.getName()] = requiredPluginState.state;
      requiredStates.push(requiredPluginState);
    }

    const { init, error } = plugin.pluginCallbacks;
    try {
      const result = wrappedFunction(this, 'init', (instance: Plugin) => init.call(instance, pluginsStates), error);
      state.state = result;
      state.isInitialized = true;
      state.requires = requiredStates;
    } catch (err) {
      if (!(err instanceof errorTypes.IgnoreError)) {
        throw err;
      }
    }

    return this;
  }

  initAll(): Plugger {
    const loadOrder = this.getLoadOrder();
    for (let x = 0, len = loadOrder.length; x < len; x += 1) {
      const plugin = loadOrder[x];
      const state = this.getState(plugin) as PluginState;
      if (!state.isInitialized) {
        this.initPlugin(loadOrder[x]);
      }
    }

    return this;
  }

  shutdownPlugin(plugin: Plugin): Plugger {
    const pluginState = this.getState(plugin);

    if (!pluginState) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    if (!pluginState.isInitialized) {
      throw new errorTypes.InitializeError('Plugin is not initialized');
    }

    const states = this.getStates();
    const requiredBy = states.filter((x) => {
      const index = x.requires.indexOf(pluginState);
      return x.isInitialized && index > -1;
    });

    if (requiredBy.length > 0) {
      const names = requiredBy.reduce(
        (acc: string[], e) => {
          acc.push(e.instance.getName());
          return acc;
        }, [],
      );
      throw new errorTypes.RequirementError(`Plugin is required by ${requiredBy.length} initialized plugins: ${names}`);
    }

    const { shutdown, error } = plugin.pluginCallbacks;
    try {
      wrappedFunction(this, 'shutdown', (instance: Plugin) => shutdown.call(instance, pluginState.state), error);
      pluginState.state = null;
      pluginState.isInitialized = false;
    } catch (err) {
      if (!(err instanceof errorTypes.IgnoreError)) {
        throw err;
      }
    }

    return this;
  }

  shutdownAll(): Plugger {
    const loadOrder = this.getLoadOrder().reverse();
    for (let x = 0, len = loadOrder.length; x < len; x += 1) {
      const plugin = loadOrder[x];
      const state = this.getState(plugin) as PluginState;
      if (state.isInitialized) {
        this.shutdownPlugin(plugin);
      }
    }

    return this;
  }

  attachExitListener(): Plugger {
    if (!this[loaderProps].useExitListener && this[loaderProps].exitListener === null) {
      const self = this;
      const exitListener = () => self.shutdownAll();
      this[loaderProps].exitListener = exitListener;

      exitEvents.forEach((event) => {
        process.on(event, this[loaderProps].exitListener as () => void);
      });
      this[loaderProps].useExitListener = true;
    }

    return this;
  }

  detachExitListener(): Plugger {
    if (this[loaderProps].useExitListener && this[loaderProps].exitListener !== null) {
      exitEvents.forEach((event) => {
        process.off(event, this[loaderProps].exitListener as () => void);
      });

      this[loaderProps].useExitListener = false;
      this[loaderProps].exitListener = null;
    }

    return this;
  }
}

export default Plugger;
