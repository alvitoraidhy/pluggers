import fs from 'fs';
import path from 'path';
import jsonfile from 'jsonfile';

import Loader from './loader';

/**
 * Some common terms:
 *
 * - **Plugger**:
 * the main class that can act as both a plugin and a loader.
 *
 * - **Plugin**:
 * a `Plugger` instance that acts as a plugin.
 *
 * - **Loader**:
 * a `Plugger` instance that acts as a loader.
 *
 * - **Loaded plugin**:
 * a plugin that has been added/loaded to a loader by using the `addPlugin()` function.
 *
 * - **Initialized plugin**:
 * a plugin that has been initialized by a loader by using the `initPlugin()` function.
 *
 * @public
 */
class Plugger extends Loader {
  /**
   * Creates a Plugger instance.
   *
   * @example
   * ```javascript
   * const Plugger = require('./pluggers').default;
   * const instance = new Plugger('master');
   * ```
   * @category Constructor
   * @param name - The name of the instance.
   */
  constructor(name: string = '') {
    super();
    if (name) this.metadata.name = name;
  }

  /**
   * Creates a Plugger instance from a JSON file asynchronously.
   *
   * @example
   * ```javascript
   * ...
   * // ./package.json: { "name": "myPlugin", "version": "1.0.0" }
   * const plugin = await Plugger.fromJsonFile();
   * console.log(plugin.getName()); // 'myPlugin'
   *
   * // '{"name": "myPlugin", "version":"1.0.0"}'
   * console.log(JSON.stringify(plugin.metadata));
   * ```
   * @category Constructor
   * @param jsonFile - Path to the JSON file, or to a directory that contains a 'package.json' file.
   * @param props - Specifies which properties to be included as the metadata of the instance.
   * @returns A Promise that resolves to a new Plugger instance.
   */
  static async fromJsonFile(jsonFile = 'package.json', props: string[] | null = null): Promise<Plugger> {
    const dirPath = process.cwd();
    let filePath = path.resolve(dirPath, jsonFile);

    const isDirectory = (await fs.promises.stat(filePath)).isDirectory();
    if (isDirectory) filePath = path.resolve(filePath, 'package.json');

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

    const instance = new Plugger(name);
    instance.metadata = { ...instance.metadata, ...metadata };

    return instance;
  }

  /**
   * Creates a Plugger instance from a JSON file synchronously.
   *
   * @example
   * ```javascript
   * ...
   * // ./package.json: { "name": "myPlugin", "version": "1.0.0" }
   * const plugin = Plugger.fromJsonFileSync();
   * console.log(plugin.getName()); // 'myPlugin'
   *
   * // '{"name": "myPlugin", "version":"1.0.0"}'
   * console.log(JSON.stringify(plugin.metadata));
   * ```
   * @category Constructor
   * @param jsonFile - Path to the JSON file, or to a directory that contains a 'package.json' file.
   * @param props - Specifies which properties to be included as the metadata of the instance.
   * @returns A new `Plugger` instance.
   */
  static fromJsonFileSync(jsonFile = 'package.json', props: string[] | null = null): Plugger {
    const dirPath = process.cwd();
    let filePath = path.resolve(dirPath, jsonFile);

    const isDirectory = fs.statSync(filePath).isDirectory();
    if (isDirectory) filePath = path.resolve(filePath, 'package.json');

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
}

export { Plugger };
export default Plugger;
