/* eslint-disable max-classes-per-file */
import { promisify } from "util";
import fs from "fs";
import path from "path";
import {
  listenerProps,
  errorTypes,
  loaderProps,
  undefinedPriority,
  pluggerIdentifier,
} from "./constants";
import { compareMetadata } from "./helpers";

import Plugin from "./plugin";

const exitEvents = ["exit", "SIGINT", "SIGTERM", "SIGQUIT"];

interface PluginEntry {
  instance: Plugin;
  priority: number;
}

class LoaderBase extends Plugin {
  private [loaderProps] = {
    pluginList: [] as PluginEntry[],
  };

  /**
   * Returns all loaded plugins.
   *
   * @category Loader
   * @returns An array of Plugger instances.
   */
  getPlugins(): Plugin[] {
    return this[loaderProps].pluginList.map((x) => x.instance) as Plugin[];
  }

  /**
   * Returns the requested plugin.
   *
   * @category Loader
   * @param name - The name of the plugin.
   * @returns A Plugger instance, or null if not found.
   */
  getPlugin(name: string): Plugin | null {
    const plugin = this[loaderProps].pluginList.find(
      (x) => x.instance.metadata.name === name
    );
    return plugin ? (plugin.instance as Plugin) : null;
  }

  /**
   * Loads the plugin to the instance.
   *
   * @category Loader
   * @param plugin - The plugin that you want to load.
   * @param priority - The load order priority of the plugin.
   * @returns The current instance.
   */
  addPlugin(plugin: Plugin, { priority = undefinedPriority } = {}): this {
    const { name } = plugin.metadata;
    if (this.getPlugin(name)) {
      // Name must be unique
      throw new errorTypes.ConflictError(
        `A plugin with the same name ('${name}') is already loaded`
      );
    }

    const newState: PluginEntry = {
      instance: plugin,
      priority:
        priority !== undefinedPriority
          ? priority
          : plugin.pluginConfig.defaultPriority,
    };

    this[loaderProps].pluginList.push(newState);
    return this;
  }

  /**
   * Removes the plugin from the instance.
   *
   * @category Loader
   * @param plugin - The plugin that you want to remove/unload.
   * @returns The current instance.
   */
  removePlugin(plugin: Plugin): this {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError("Plugin is not loaded");
    }

    if (plugin.isInitialized()) {
      throw new errorTypes.InitializeError("Plugin is initialized");
    }

    const newList = this[loaderProps].pluginList.filter(
      (x) => x.instance !== plugin
    );
    this[loaderProps].pluginList = newList;
    return this;
  }

  /**
   * Returns the load order of the instance.
   *
   * @category Loader
   * @returns All loaded plugins, sorted to their load order.
   */
  getLoadOrder(): Plugin[] {
    /*
    Flow of Process
      - Positive priorities will be processed first,
      - Undefined priorites will be processed before negative priorities, and then will be flatten
      - Negative priorities will be processed last
    */
    const { pluginList } = this[loaderProps];
    const priorities = pluginList
      .filter((x) => x.priority !== undefinedPriority)
      .reduce((acc: { [key: number]: Plugin[] }, e: PluginEntry) => {
        if (!acc[e.priority]) acc[e.priority] = [];
        acc[e.priority].push(e.instance);
        return acc;
      }, {});

    const keys = Object.keys(priorities).map((e) => Number(e));
    const positives = keys.filter((x) => x >= 0).sort((a, b) => a - b);
    const negatives = keys.filter((x) => x < 0).sort((a, b) => a - b);

    // Process positive numbers first
    const positiveArr = positives.map((x) => priorities[x]);

    // Process plugins with undefined priority
    const undefinedPriorities = pluginList.filter(
      (x) => x.priority === undefinedPriority
    );
    const undefinedPriorityPlugins = undefinedPriorities.map((x) => x.instance);

    if (undefinedPriorityPlugins.length > 0) {
      positiveArr.push(undefinedPriorityPlugins);
    }

    // Process plugins with negative priority
    const arr = negatives.reduce((acc: Plugin[] | Plugin[][], e) => {
      const index = acc.length + e + 1;
      acc.splice(index < 0 ? 0 : index, 0, priorities[e]);
      return acc;
    }, positiveArr.flat());

    return arr.flat();
  }

  /**
   * Sorts the load order of the instance.
   *
   * Plugins that are required by other plugins are set to initialize first. Their priorities are
   * also taken into consideration.
   *
   * @category Loader
   * @returns The current instance.
   */
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
            throw new errorTypes.RequirementError(
              `Required plugin is not loaded -> '${requiredPlugins[j]}' (required by '${arr[i].metadata.name}')`
            );
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
    const newLoadOrder = arr.map(
      (x) => pluginList.find((y) => y.instance === x) as PluginEntry
    );

    this[loaderProps].pluginList = newLoadOrder;

    return this;
  }

  /**
   * Returns wheter the plugin is loaded by the instance or not.
   *
   * @category Loader
   * @returns true if the plugin is loaded by the instance, else false.
   */
  hasLoaded(plugin: Plugin): boolean {
    return this[loaderProps].pluginList.some((x) => x.instance === plugin);
  }
}

export default class Loader extends LoaderBase {
  private [listenerProps] = {
    useExitListener: false as boolean,
    exitListener: null as (() => void) | null,
  };

  /**
   * Initializes the plugin asynchronously.
   *
   * @category Loader
   * @param plugin - The plugin that you want to initialize.
   * @returns A Promise that resolves to the current instance.
   */
  initPlugin(plugin: Plugin): Promise<this> {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError("Plugin is not loaded");
    }

    return plugin.createSession(async () => {
      if (plugin.isInitialized()) {
        throw new errorTypes.InitializeError("Plugin is already initialized");
      }

      const requiredStates: { [key: string]: ReturnType<Plugin["getState"]> } =
        {};

      await Promise.all(
        plugin.getRequiredPlugins().map(async (metadata) => {
          const requiredPlugin = this.getPlugin(metadata.name);
          if (!requiredPlugin) {
            throw new errorTypes.RequirementError(
              `Required plugin is not loaded -> '${metadata.name}' (required by '${plugin.metadata.name}')`
            );
          }

          const loadedMetadata = requiredPlugin.metadata;
          if (!compareMetadata(metadata, loadedMetadata)) {
            throw new errorTypes.RequirementError(`
            Required plugin's metadata does not match loaded plugin's metadata (required by '${
              plugin.metadata.name
            }')\n
            Required plugin: ${JSON.stringify(metadata)}\n
            Loaded plugin: ${JSON.stringify(loadedMetadata)}
          `);
          }

          await requiredPlugin.createSession(() => {
            if (!requiredPlugin.isInitialized()) {
              throw new errorTypes.RequirementError(
                `Required plugin is not initialized -> '${metadata.name}' (required by '${plugin.metadata.name}')`
              );
            }

            requiredStates[requiredPlugin.metadata.name] =
              requiredPlugin.getState();
          });
        })
      );

      await plugin.selfInit(requiredStates);

      return this;
    }) as Promise<this>;
  }

  /**
   * Initializes all loaded plugins asynchronously in parallel.
   *
   * @category Loader
   * @returns A Promise that resolves to the current instance.
   */
  async initAll(): Promise<this> {
    const loadOrder = this.getLoadOrder();

    await Promise.all(
      loadOrder.map(async (plugin) => {
        if (!plugin.isInitialized()) {
          await this.initPlugin(plugin);
        }
      })
    );

    return this;
  }

  /**
   * Shuts down the plugin asynchronously.
   *
   * @category Loader
   * @param plugin - The plugin that you want to shutdown.
   * @returns A Promise that resolves to the current instance.
   */
  shutdownPlugin(plugin: Plugin): Promise<this> {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError("Plugin is not loaded");
    }

    return plugin.createSession(async () => {
      if (!plugin.isInitialized()) {
        throw new errorTypes.InitializeError("Plugin is not initialized");
      }

      const plugins = this.getPlugins().filter((x) =>
        x.requires({ name: plugin.metadata.name })
      );
      const requiredBy: Plugin[] = [];
      await Promise.all(
        plugins.map((x) =>
          x.createSession(() => {
            if (x.isInitialized()) requiredBy.push(x);
          })
        )
      );

      if (requiredBy.length > 0) {
        const names = requiredBy.map((x) => x.metadata.name);
        throw new errorTypes.RequirementError(
          `Plugin is required by ${requiredBy.length} initialized plugins: ${names}`
        );
      }

      await plugin.selfShutdown();

      return this;
    }) as Promise<this>;
  }

  /**
   * Shuts down all loaded plugins asynchronously in parallel.
   *
   * @category Loader
   * @returns A Promise that resolves to the current instance.
   */
  async shutdownAll(): Promise<this> {
    const loadOrder = this.getLoadOrder().reverse();
    await Promise.all(
      loadOrder.map(async (plugin) => {
        if (plugin.isInitialized()) {
          await this.shutdownPlugin(plugin);
        }
      })
    );

    return this;
  }

  /**
   * Adds an event listener that shuts down all loaded plugins when the process is exiting.
   *
   * This will run a function that executes `instance.shutdownAll()` when an exit event signal is
   * emitted by `process`. It is recommended to only run this method on your main loader instance,
   * as to not pollute the event with many listeners (NodeJS limited the number of listeners to
   * 10 per event by default). Running this method multiple times on the same instance won't
   * register multiple listeners.
   *
   * @category Loader
   * @returns The current instance.
   */
  attachExitListener(): this {
    if (
      !this[listenerProps].useExitListener &&
      this[listenerProps].exitListener === null
    ) {
      const exitListener = () => this.shutdownAll();
      this[listenerProps].exitListener = exitListener;

      exitEvents.forEach((event) => {
        process.on(event, this[listenerProps].exitListener as () => void);
      });

      this[listenerProps].useExitListener = true;
    }

    return this;
  }

  /**
   * Removes the attached event listener from the process.
   *
   * Running this method without running `attachExitListener()` first won't do anything.
   *
   * @category Loader
   */
  detachExitListener(): this {
    if (
      this[listenerProps].useExitListener &&
      this[listenerProps].exitListener !== null
    ) {
      exitEvents.forEach((event) => {
        process.off(event, this[listenerProps].exitListener as () => void);
      });

      this[listenerProps].useExitListener = false;
      this[listenerProps].exitListener = null;
    }

    return this;
  }
}
