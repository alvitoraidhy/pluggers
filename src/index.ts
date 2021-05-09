/* eslint-disable no-use-before-define */
import {
  undefinedPriority, loaderProps, pluginProps, errorTypes,
} from './constants';

const {
  RequirementError, ConflictError, NotLoadedError, NotInitializedError,
} = errorTypes;

interface PluginState {
  instance: Plugger;
  isInitialized: boolean;
  state: any;
  priority: number;
}

class Plugger {
  private [loaderProps]: {
    pluginList: PluginState[]
  };

  private [pluginProps]: {
    pluginName: string,
    requiredPlugins: string[],
    pluginInit: Function
  };

  loaderConfig: {
    autoInit: boolean,
    autoSort: boolean
  };

  pluginConfig: {
    metadata: object,
    defaultPriority: number
  };

  static errorTypes = {
    RequirementError, ConflictError, NotLoadedError, NotInitializedError,
  };

  constructor(name: string) {
    this[loaderProps] = {
      // Loader properties
      // - Accessable using methods only
      pluginList: [],
    };

    this[pluginProps] = {
      pluginName: name,
      requiredPlugins: [],
      pluginInit: () => {},
    };

    this.loaderConfig = {
      // Loader configuration
      // - Publicly accessable
      autoInit: true,
      autoSort: false,
    };

    this.pluginConfig = {
      metadata: {},
      defaultPriority: undefinedPriority,
    };
  }

  getName(): string {
    return this[pluginProps].pluginName;
  }

  getRequiredPlugins(): string[] {
    return this[pluginProps].requiredPlugins;
  }

  removeRequiredPlugin(name: string): Plugger {
    const index = this[pluginProps].requiredPlugins.indexOf(name);
    if (!(index > -1)) {
      throw new RequirementError(`Plugin with the name "${name}" is not required`);
    }

    this[pluginProps].requiredPlugins.splice(index, 1);
    return this;
  }

  requirePlugin(name:string) {
    if (this[pluginProps].requiredPlugins.indexOf(name) > -1) {
      throw new ConflictError(`Plugin with the name "${name}" is already required`);
    }

    this[pluginProps].requiredPlugins.push(name);
    return this;
  }

  getInit(): Function {
    return this[pluginProps].pluginInit;
  }

  setInit(func: Function): Plugger {
    this[pluginProps].pluginInit = func;
    return this;
  }

  getPlugins(): { [key: string]: Plugger } {
    const plugins = this[loaderProps].pluginList.reduce(
      (acc: { [key:string]: Plugger }, plugin: PluginState) => {
        acc[plugin.instance.getName()] = plugin.instance;
        return acc;
      }, {},
    );
    return plugins;
  }

  getPlugin(name: string): Plugger | null {
    const plugin = this[loaderProps].pluginList.find((x) => x.instance.getName() === name);
    return plugin ? plugin.instance : null;
  }

  getStates(): PluginState[] {
    return this[loaderProps].pluginList;
  }

  getState(plugin: Plugger): PluginState {
    const state = this[loaderProps].pluginList.find((x) => x.instance === plugin);

    if (!state) {
      throw new NotLoadedError('Plugin is not loaded');
    }

    return state;
  }

  addPlugin(plugin: Plugger, { priority = undefinedPriority } = {}) {
    const name = plugin.getName();
    if (this.getPlugin(name)) { // Name must be unique
      throw new ConflictError(`A plugin with the same name (${name}) is already loaded`);
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

  removePlugin(plugin: Plugger) {
    const state = this.getStates().find((x) => x.instance === plugin);
    if (!state) {
      throw new NotLoadedError('Plugin is not loaded');
    }

    this[loaderProps].pluginList.splice(this[loaderProps].pluginList.indexOf(state), 1);
    return this;
  }

  getLoadOrder(): Plugger[] {
    /*
    Flow of Process
    - Positive priorities will be processed first,
    - Undefined priorites will be processed before negative priorities, and then will be flatten
    - Negative priorities will be processed last
    */
    const states = this.getStates();
    const priorities = states.filter((x) => x.priority !== undefinedPriority).reduce(
      (acc: { [key: number]: Plugger[] }, e: PluginState) => {
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
      (acc: Plugger[][], e) => {
        acc.push(priorities[e]);
        return acc;
      }, [],
    );

    // Process plugins with undefined priority
    const undefinedPriorities = states.filter((x) => x.priority === undefinedPriority);
    const undefinedPriorityPlugins = undefinedPriorities.reduce(
      (acc: Plugger[], e) => {
        acc.push(e.instance);
        return acc;
      }, [],
    );

    if (undefinedPriorityPlugins.length > 0) {
      positiveArr.push(undefinedPriorityPlugins);
    }

    // Process plugins with negative priority
    const arr: Plugger[] = negatives.reduce((acc: any[], e) => {
      const index = acc.length + e + 1;
      acc.splice(index < 0 ? 0 : index, 0, priorities[e]);
      return acc;
    }, positiveArr.flat()).flat();

    return arr;
  }

  getSortedLoadOrder(loadOrder = this.getLoadOrder()) {
    const arr = [...loadOrder];

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
            throw new RequirementError(`Required plugin is not loaded -> '${requiredPlugins[j]}' (required by '${arr[i].getName()}')`);
          }

          if (i < index) {
            arr.splice(index, 1);
            arr.splice(i, 0, plugin);
            sorted = false;
          }
        }
      }
    }

    return arr;
  }

  initPlugin(plugin: Plugger): any {
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
        throw new RequirementError(`Required plugin is not loaded -> '${requiredPluginName}' (required by '${plugin.getName()}')`);
      }

      const requiredPluginState = this.getState(requiredPlugin);
      if (!requiredPluginState.isInitialized) {
        throw new NotInitializedError(`Required plugin is not initialized -> '${requiredPluginName}' (required by '${plugin.getName()}')`);
      }

      pluginsStates[requiredPlugin.getName()] = requiredPluginState.state;
    }

    const result = plugin.getInit()(pluginsStates);
    state.isInitialized = true;
    state.state = result;
    return this;
  }

  initAll(autoSort: boolean = this.loaderConfig.autoSort) {
    const loadOrder = autoSort ? this.getSortedLoadOrder() : this.getLoadOrder();
    for (let x = 0, len = loadOrder.length; x < len; x += 1) {
      this.initPlugin(loadOrder[x]);
    }
    return this;
  }
}

export default Plugger;
