import fs from 'fs';
import glob from 'tiny-glob/sync';
import path from 'path';
import jsonfile from 'jsonfile';

import {
  pluggerProps, errorTypes,
} from '../constants';

import {
  compareMetadata,
} from '../helpers';

import Plugin from './plugin';

const exitEvents = ['exit', 'SIGINT', 'SIGTERM', 'SIGQUIT'];

export default class Plugger extends Plugin {
  [pluggerProps] = {
    useExitListener: false as boolean,
    exitListener: null as (() => void) | null,
  };

  static fromJsonFile(jsonFile = 'package.json', props: string[] | null = null) {
    const dirPath = process.cwd();
    const filePath = path.resolve(dirPath, jsonFile);

    const { name, ...data }: {
      name: string,
      defaultPriority: number,
      [key: string]: any,
    } = jsonfile.readFileSync(filePath);

    const metadata = props !== null ? props.reduce((
      acc: { [key: string]: unknown }, e,
    ) => {
      acc[e] = data[e];
      return acc;
    }, {}) : data;

    const instance = new Plugger(name);
    instance.metadata = { ...instance.metadata, ...metadata };

    return instance;
  }

  addFolder(dir: string): this {
    const dirPath = process.cwd();
    const fullPath = path.resolve(dirPath, dir);

    fs.accessSync(path.join(fullPath, '/'));

    glob(path.join(fullPath, '*/index.{ts,js}'), { absolute: true }).forEach((pluginPath: string) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const plugin = require(path.dirname(pluginPath));

      if (plugin instanceof Plugin) this.addPlugin(plugin);
      else if (plugin.default instanceof Plugin) this.addPlugin(plugin.default);
    });

    return this;
  }

  initPlugin(plugin: Plugin): this {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    if (plugin.isInitialized()) {
      throw new errorTypes.InitializeError('Plugin is already initialized');
    }

    const requiredStates: { [key: string]: ReturnType<Plugin['getState']> } = {};

    plugin.getRequiredPlugins().forEach((metadata: Plugin['metadata']) => {
      const requiredPlugin = this.getPlugin(metadata.name);
      if (!requiredPlugin) {
        throw new errorTypes.RequirementError(`Required plugin is not loaded -> '${metadata.name}' (required by '${plugin.metadata.name}')`);
      }

      const loadedMetadata = requiredPlugin.metadata;
      if (!compareMetadata(metadata, loadedMetadata)) {
        throw new errorTypes.RequirementError(`
          Required plugin's metadata does not match loaded plugin's metadata (required by '${plugin.metadata.name}')\n
          Required plugin: ${JSON.stringify(metadata)}\n
          Loaded plugin: ${JSON.stringify(loadedMetadata)}
        `);
      }

      if (!requiredPlugin.isInitialized()) {
        throw new errorTypes.RequirementError(`Required plugin is not initialized -> '${metadata.name}' (required by '${plugin.metadata.name}')`);
      }

      requiredStates[requiredPlugin.metadata.name] = requiredPlugin.getState();
    });

    plugin.selfInit(requiredStates);

    return this;
  }

  initAll(): this {
    const loadOrder = this.getLoadOrder() as Plugin[];
    loadOrder.forEach((plugin) => {
      if (!plugin.isInitialized()) this.initPlugin(plugin);
    });

    return this;
  }

  shutdownPlugin(plugin: Plugin): this {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    if (!plugin.isInitialized()) {
      throw new errorTypes.InitializeError('Plugin is not initialized');
    }

    const plugins = this.getPlugins().filter((x) => x.isInitialized());
    const requiredBy = plugins.filter((x) => x.requires({ name: plugin.metadata.name }));
    if (requiredBy.length > 0) {
      const names = requiredBy.map((x) => x.metadata.name);
      throw new errorTypes.RequirementError(`Plugin is required by ${requiredBy.length} initialized plugins: ${names}`);
    }

    plugin.selfShutdown();

    return this;
  }

  shutdownAll(): this {
    const loadOrder = this.getLoadOrder().reverse() as Plugin[];
    loadOrder.forEach((plugin) => {
      if (plugin.isInitialized()) this.shutdownPlugin(plugin);
    });

    return this;
  }

  attachExitListener(): this {
    if (!this[pluggerProps].useExitListener && this[pluggerProps].exitListener === null) {
      const exitListener = () => this.shutdownAll();
      this[pluggerProps].exitListener = exitListener;

      exitEvents.forEach((event) => {
        process.on(event, this[pluggerProps].exitListener as () => void);
      });

      this[pluggerProps].useExitListener = true;
    }

    return this;
  }

  detachExitListener(): this {
    if (this[pluggerProps].useExitListener && this[pluggerProps].exitListener !== null) {
      exitEvents.forEach((event) => {
        process.off(event, this[pluggerProps].exitListener as () => void);
      });

      this[pluggerProps].useExitListener = false;
      this[pluggerProps].exitListener = null;
    }

    return this;
  }
}
