const assert = require('assert');

const plug_init = Symbol('plug_init');
const plug_parent = Symbol('plug_parent');
const plug_name = Symbol('plug_name');
const required_plugs = Symbol('required_plugs');
const plugs = Symbol('plugs');

const isString = function(str) {return typeof str === 'string' || str instanceof String;}
const isPlug = function(instance) {return instance instanceof Plugger}

class Plugger {
  constructor(name) {
    if (!isString(name)) {
      throw new TypeError('Plug name must be string!');
    }

    this[plug_parent] = null;
    this[plug_name] = name;
    this[plugs] = {};
    this[required_plugs] = [];
    this[plug_init] = function() {;};
  }

  getName() {return this[plug_name];}
  setName(name) {
    if (!isString(name)) {
      throw new TypeError('Plug name must be string!');
    }

    this[plug_name] = name;
    return true;
  }

  getParent() {return this[plug_parent];}
  setParent(parent) {
    if (!isPlug(parent)) {
      throw new TypeError('Parent must be a Plugger instance!')
    }
    this[plug_parent] = parent;
    return true;
  }

  getPlugs() {return this[plugs];}

  addPlug(plug) {
    if (isString(plug)) {
      plug = require(plug);
      if (!isPlug(plug)) {
        throw new Error('Module must exports a Plugger instance!');
      }
    }
    else if (!isPlug(plug)) {
      throw new TypeError('Must be a Plugger instance or a module path!');
    }

    var name = plug.getName();
    if (!Object.keys(this[plugs]).includes(name)) {
      var required = plug.getRequiredPlugs();
      for (var x in required) {
        var required_name = required[x].getName();
        if (!this[plugs][required_name]) {
          throw new Error('Required Plug not found! -> ' + required_name);    
        }
      }
      this[plugs][name] = plug;
      plug.setParent(this);
      plug.initPlug();
      return true;
    }
    else {
      throw new Error('A Plug with the same name already exists!');
    }
  }
  removePlug(plug) {
    if (isString(plug)) {
      plug = require(plug);
      if (!isPlug(plug)) {
        throw new Error('Module must exports a Plugger instance!');
      }
    }
    else if (!isPlug(plug)) {
      throw new TypeError('Must be a Plugger instance or a module path!');
    }

    var name = plug.getName();
    if (Object.keys(this[plugs]).includes(name)) {
      delete this[plugs][name];
      return true;
    }
    else {
      throw new Error('Plug instance not found!');
    }
  }
  getPlug(name) {
    if (!isString(name)) {
      throw new TypeError('Plug name must be string!');
    }

    if (Object.keys(this[plugs]).includes(name)) {
      return this[plugs][name];
    }
    else {
      return null;
    }
  }

  getRequiredPlugs() {
    return this[required_plugs];
  }
  removeRequiredPlug(name) {
    if (this[required_plugs].indexOf(name) > -1) {
      this[required_plugs].splice(name, 1);
    }
    return true;
  }
  requirePlug(name) {
    if (!this[required_plugs].indexOf(name) > -1) {
      this[required_plugs].push(name);
    }
    return true;
  }

  setInit(func) {
    if (typeof func === "function") {
      this[plug_init] = func;
      return true;
    }
    else {
      throw new TypeError('Must be a function!');
    }
  }

  initPlug() {
    return this[plug_init]();
  }
}

module.exports = Plugger;