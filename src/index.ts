import fs from "fs";
import path from "path";

import Loader from "./loader";
import { pluggerIdentifier } from "./constants";

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
  /** @ignore */
  [pluggerIdentifier] = true;

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
  constructor(name = "") {
    super();
    if (name) this.metadata.name = name;
  }
}

export { Plugger };
export default Plugger;
