import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import glob from 'tiny-glob';
import jsonfile from 'jsonfile';
import {
  pluggerProps, errorTypes,
} from '../constants';
import { compareMetadata } from '../helpers';

import Plugin from './plugin';

const exitEvents = ['exit', 'SIGINT', 'SIGTERM', 'SIGQUIT'];

export default class AsyncPlugger extends Plugin {
  [pluggerProps] = {
    useExitListener: false as boolean,
    exitListener: null as (() => void) | null,
  };

  static async fromJsonFile(jsonFile = 'package.json', props: string[] | null = null): Promise<AsyncPlugger> {
    const dirPath = process.cwd();
    const filePath = path.resolve(dirPath, jsonFile);

    const { name, ...data }: {
      name: string,
      defaultPriority: number,
      [key: string]: any,
    } = await jsonfile.readFile(filePath);

    const metadata = props !== null ? props.reduce((
      acc: { [key: string]: unknown }, e,
    ) => {
      acc[e] = data[e];
      return acc;
    }, {}) : data;

    const instance = new AsyncPlugger(name);
    instance.metadata = { ...instance.metadata, ...metadata };

    return instance;
  }

  async addFolder(dir: string): Promise<this> {
    const dirPath = process.cwd();
    const fullPath = path.resolve(dirPath, dir);

    await promisify(fs.access)(path.join(fullPath, '/'));

    const files = await glob(path.join(fullPath, '*/index.{ts,js}'), { absolute: true });
    files.forEach((pluginPath: string) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const plugin = require(path.dirname(pluginPath));

      if (plugin instanceof Plugin) this.addPlugin(plugin);
      else if (plugin.default instanceof Plugin) this.addPlugin(plugin.default);
    });

    return this;
  }

  async initPlugin(plugin: Plugin): Promise<this> {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    await plugin.createSession(async () => {
      if (plugin.isInitialized()) {
        throw new errorTypes.InitializeError('Plugin is already initialized');
      }

      const requiredStates: { [key: string]: ReturnType<Plugin['getState']> } = {};

      await Promise.all(plugin.getRequiredPlugins().map(async (metadata) => {
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

        await requiredPlugin.createSession(() => {
          if (!requiredPlugin.isInitialized()) {
            throw new errorTypes.RequirementError(`Required plugin is not initialized -> '${metadata.name}' (required by '${plugin.metadata.name}')`);
          }

          requiredStates[requiredPlugin.metadata.name] = requiredPlugin.getState();
        });
      }));

      await plugin.selfInit(requiredStates);
    });

    return this;
  }

  async initAll(): Promise<this> {
    const loadOrder = this.getLoadOrder();

    await Promise.all(loadOrder.map(async (plugin) => {
      if (!plugin.isInitialized()) {
        await this.initPlugin(plugin);
      }
    }));

    return this;
  }

  async shutdownPlugin(plugin: Plugin): Promise<this> {
    if (!this.hasLoaded(plugin)) {
      throw new errorTypes.LoadError('Plugin is not loaded');
    }

    await plugin.createSession(async () => {
      if (!plugin.isInitialized()) {
        throw new errorTypes.InitializeError('Plugin is not initialized');
      }

      const plugins = this.getPlugins().filter((x) => x.requires({ name: plugin.metadata.name }));
      const requiredBy: Plugin[] = [];
      await Promise.all(plugins.map((x) => x.createSession(() => {
        if (x.isInitialized()) requiredBy.push(x);
      })));

      if (requiredBy.length > 0) {
        const names = requiredBy.map((x) => x.metadata.name);
        throw new errorTypes.RequirementError(`Plugin is required by ${requiredBy.length} initialized plugins: ${names}`);
      }

      await plugin.selfShutdown();
    });

    return this;
  }

  async shutdownAll(): Promise<this> {
    const loadOrder = this.getLoadOrder().reverse();
    await Promise.all(loadOrder.map(async (plugin) => {
      if (plugin.isInitialized()) {
        await this.shutdownPlugin(plugin);
      }
    }));

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
