/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const pluginInit = Symbol('pluginInit');
const pluginParent = Symbol('pluginParent');
const pluginName = Symbol('pluginName');
const requredPlugins = Symbol('requredPlugins');
const plugins = Symbol('plugins');

const { RequirementError, ConflictError, NotLoadedError } = require('./errors.js');

const isString = (str) => typeof str === 'string' || str instanceof String;

class Plugger {
  constructor(name) {
    if (!isString(name)) {
      throw new TypeError(`${name} is not a string`);
    }

    this[pluginParent] = null;
    this[pluginName] = name;
    this[plugins] = {};
    this[requredPlugins] = [];
    this[pluginInit] = () => {};
  }

  getName() { return this[pluginName]; }

  setName(name) {
    if (!isString(name)) {
      throw new TypeError(`${name} is not a string`);
    }

    this[pluginName] = name;
    return true;
  }

  getParent() { return this[pluginParent]; }

  setParent(parent) {
    if (!(parent instanceof Plugger || parent === null)) {
      throw new TypeError(`${parent} is not a Plugger instance or null`);
    }
    this[pluginParent] = parent;
    return true;
  }

  getPlugins() { return this[plugins]; }

  addPlugin(param) {
    let plugin = param;
    if (isString(param)) {
      plugin = require(param);
      if (!(plugin instanceof Plugger)) {
        throw new TypeError(`${plugin} is not a Plugger instance`);
      }
    } else if (!(param instanceof Plugger)) {
      throw new TypeError(`${param} is not a Plugger instance or a string`);
    }

    const name = plugin.getName();
    if (!Object.keys(this[plugins]).includes(name)) {
      const required = plugin.getRequiredPlugins();
      required.forEach((requiredPluginName) => {
        if (typeof this[plugins][requiredPluginName] === 'undefined') {
          throw new RequirementError(`Required plugin is not loaded -> '${requiredPluginName}' (required by '${name}')`);
        }
      });
      this[plugins][name] = plugin;
      plugin.setParent(this);
      plugin.initPlugin();
      return true;
    }
    throw new ConflictError(`A plugin with the same name (${name}) is already loaded`);
  }

  removePlugin(param) {
    let name;
    if (param instanceof Plugger) {
      name = param.getName();
    } else if (isString(param)) {
      let plugin;
      try {
        plugin = require(param);
      } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') {
          throw err;
        }
        name = param;
      }
      if (!(plugin instanceof Plugger) && name !== param) {
        throw new TypeError(`${plugin} is not a Plugger instance`);
      }
    } else {
      throw new TypeError(`${param} is not a Plugger instance or a string`);
    }

    if (Object.keys(this[plugins]).includes(name)) {
      this[plugins][name].setParent(null);
      delete this[plugins][name];
      return true;
    }

    throw new NotLoadedError(`Plugin with the name '${name}' is not loaded`);
  }

  getPlugin(name) {
    if (!isString(name)) {
      throw new TypeError(`${name} is not a string`);
    }

    if (Object.keys(this[plugins]).includes(name)) {
      return this[plugins][name];
    }

    return null;
  }

  getRequiredPlugins() {
    return this[requredPlugins];
  }

  removeRequiredPlugin(name) {
    if (!isString(name)) {
      throw new TypeError(`${name} is not a string`);
    }
    if (this[requredPlugins].indexOf(name) > -1) {
      this[requredPlugins].splice(name, 1);
    }
    return true;
  }

  requirePlugin(name) {
    if (!isString(name)) {
      throw new TypeError(`${name} is not a string`);
    }
    if (!this[requredPlugins].indexOf(name) > -1) {
      this[requredPlugins].push(name);
    }
    return true;
  }

  setInit(func) {
    if (typeof func === 'function') {
      this[pluginInit] = func;
      return true;
    }

    throw new TypeError(`${func} is not a function`);
  }

  initPlugin() {
    return this[pluginInit]();
  }
}

Plugger.errorTypes = { RequirementError, ConflictError, NotLoadedError };

// For backward compatibility
Plugger.prototype.getPlugs = Plugger.prototype.getPlugins;
Plugger.prototype.addPlug = Plugger.prototype.addPlugin;
Plugger.prototype.removePlug = Plugger.prototype.removePlugin;
Plugger.prototype.getPlug = Plugger.prototype.getPlugin;
Plugger.prototype.getRequiredPlugs = Plugger.prototype.getRequiredPlugins;
Plugger.prototype.removeRequiredPlug = Plugger.prototype.removeRequiredPlugin;
Plugger.prototype.requirePlug = Plugger.prototype.requirePlugin;
Plugger.prototype.initPlug = Plugger.prototype.initPlugin;

module.exports = Plugger;
