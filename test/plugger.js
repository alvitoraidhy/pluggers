const assert = require('assert');
const Plugger = require('../index');

describe('Plugger(name: string)', () => {
  it('should create an instance', () => {
    const name = 'plugin';
    const plugin = new Plugger(name);
    assert.strictEqual(plugin instanceof Plugger, true);
  });

  it('should throw an error (TypeError) when \'name\' argument is not a string', () => {
    const nonString = [1, 2, 3];
    assert.throws(() => {
      // eslint-disable-next-line no-unused-vars
      const plugin = new Plugger(nonString);
    }, TypeError);
  });

  describe('#getName()', () => {
    it('should return the plugin\'s name', () => {
      const name = 'plugin';
      const plugin = new Plugger(name);
      assert.strictEqual(plugin.getName(), name);
    });
  });

  describe('#setName(name: string)', () => {
    it('should change the plugin\'s name properly', () => {
      const name = 'plugin';
      const plugin = new Plugger(name);
      assert.strictEqual(plugin.getName(), name);

      const newName = 'plugin-new';
      plugin.setName(newName);
      assert.strictEqual(plugin.getName(), newName);
    });

    it('should throw an error (TypeError) when name is not a string', () => {
      const plugin = new Plugger('plugin');
      const type = [];
      assert.strictEqual(typeof type === 'string' || type instanceof String, false);
      assert.throws(() => {
        plugin.setName(type);
      }, TypeError);
    });
  });

  describe('#addPlugin(plugin: Plugger | string)', () => {
    it('should load a plugin from its instance (plugin: Plugger)', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');
      assert.strictEqual(parent.addPlugin(child), true);
      assert.strictEqual(child.getParent(), parent);
    });

    it('should load a plugin from its module path (plugin: string)', () => {
      const parent = new Plugger('parent');
      assert.strictEqual(parent.addPlugin(`${__dirname}/assets/childPlugin`), true);
    });

    it('should throw an error (TypeError) when module from path is not directly exporting a Plugger instance', () => {
      const parent = new Plugger('parent');
      assert.throws(() => {
        parent.addPlugin(`${__dirname}/assets/invalidPlugin`);
      }, TypeError);
    });

    it('should throw an error (TypeError) when \'plugin\' argument is not a Plugger instance or a string', () => {
      const parent = new Plugger('parent');
      const type = [];
      assert.strictEqual(typeof type === 'string' || type instanceof String, false);
      assert.strictEqual(type instanceof Plugger, false);
      assert.throws(() => {
        parent.addPlugin(type);
      }, TypeError);
    });

    it('should throw an error (RequirementError) when a required plugin(s) is not loaded', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');
      child.requirePlugin('requiredPlugin');
      assert.throws(() => {
        parent.addPlugin(child);
      }, Plugger.errorTypes.RequirementError);
    });

    it('should load a plugin when its required plugin(s) is loaded', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');
      const requiredPlugin = new Plugger('requiredPlugin');
      child.requirePlugin('requiredPlugin');

      assert.strictEqual(parent.addPlugin(requiredPlugin), true);
      assert.strictEqual(parent.addPlugin(child), true);
      assert.strictEqual(child.getParent(), parent);
    });

    it('should throw an error (ConflictError) when another plugin with the same name is already loaded', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');
      const childSameName = new Plugger(child.getName());

      assert.strictEqual(parent.addPlugin(child), true);
      assert.throws(() => {
        parent.addPlugin(childSameName);
      }, Plugger.errorTypes.ConflictError);
    });
  });

  describe('#getPlugin(name: string)', () => {
    it('should return the requested loaded plugin', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');

      assert.strictEqual(parent.addPlugin(child), true);
      assert.strictEqual(parent.getPlugin('child'), child);
    });

    it('should return null when the requested plugin is not loaded', () => {
      const parent = new Plugger('parent');
      assert.strictEqual(parent.getPlugin('nonexistent'), null);
    });

    it('should throw an error (TypeError) when \'name\' argument is not a string', () => {
      const parent = new Plugger('parent');
      const type = [];
      assert.strictEqual(typeof type === 'string' || type instanceof String, false);
      assert.throws(() => {
        parent.getPlugin(type);
      }, TypeError);
    });
  });

  describe('#removePlugin(plugin: Plugger | string)', () => {
    it('should unload the requested loaded plugin', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');

      assert.strictEqual(parent.addPlugin(child), true);
      assert.strictEqual(parent.removePlugin(child), true);
      assert.strictEqual(child.getParent(), null);
    });

    it('should throw an error (NotLoadedError) when the requested plugin is not loaded', () => {
      const parent = new Plugger('parent');

      assert.throws(() => {
        parent.removePlugin('nonexistent');
      }, Plugger.errorTypes.NotLoadedError);
    });

    it('should throw an error (TypeError) when module from path is not directly exporting a Plugger instance', () => {
      const parent = new Plugger('parent');
      assert.throws(() => {
        parent.removePlugin(`${__dirname}/assets/invalidPlugin`);
      }, TypeError);
    });

    it('should throw an error (Error) when anything unexpected happens', () => {
      const parent = new Plugger('parent');
      assert.throws(() => {
        parent.removePlugin(`${__dirname}/assets/brokenModule`);
      });
    });

    it('should throw an error (TypeError) when \'plugin\' argument is not a Plugger instance or a string', () => {
      const parent = new Plugger('parent');
      const type = [];
      assert.strictEqual(typeof type === 'string' || type instanceof String, false);
      assert.strictEqual(type instanceof Plugger, false);
      assert.throws(() => {
        parent.removePlugin(type);
      }, TypeError);
    });
  });

  describe('#setParent(plugin: Plugger | null)', () => {
    it('should accept a Plugger instance', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');
      child.setParent(parent);
      assert.strictEqual(child.getParent(), parent);
    });

    it('should accept null', () => {
      const child = new Plugger('child');
      child.setParent(null);
      assert.strictEqual(child.getParent(), null);
    });

    it('shouldn\'t accept types other than a Plugger instance or null', () => {
      const child = new Plugger('child');
      const type = 'string';
      assert.strictEqual(type instanceof Plugger || type === null, false);
      assert.throws(() => {
        child.setParent(type);
      }, TypeError);
    });
  });

  describe('#getPlugins()', () => {
    it('should return all loaded plugins', () => {
      const parent = new Plugger('parent');
      const child1 = new Plugger('child1');
      const child2 = new Plugger('child2');
      const plugins = {};
      plugins[child1.getName()] = child1;
      plugins[child2.getName()] = child2;
      assert.strictEqual(parent.addPlugin(child1), true);
      assert.strictEqual(parent.addPlugin(child2), true);
      assert.deepStrictEqual(parent.getPlugins(), plugins);
    });
  });

  describe('#requirePlugin(name: string)', () => {
    it('should add the requested plugin requirement', () => {
      const parent = new Plugger('parent');

      assert.strictEqual(parent.requirePlugin('required'), true);
      assert.deepStrictEqual(parent.getRequiredPlugins(), ['required']);
    });

    it('should return true even when the requested plugin is already required', () => {
      const parent = new Plugger('parent');

      assert.strictEqual(parent.requirePlugin('required'), true);
      assert.strictEqual(parent.requirePlugin('required'), true);
      assert.deepStrictEqual(parent.getRequiredPlugins(), ['required']);
    });

    it('should throw an error (TypeError) when \'name\' argument is not a string', () => {
      const plugin = new Plugger('plugin');
      const type = [];
      assert.strictEqual(typeof type === 'string' || type instanceof String, false);
      assert.throws(() => {
        plugin.requirePlugin(type);
      }, TypeError);
    });
  });

  describe('#removeRequiredPlugin(name: string)', () => {
    it('should remove the requested plugin requirement', () => {
      const parent = new Plugger('parent');

      assert.strictEqual(parent.requirePlugin('required'), true);
      assert.deepStrictEqual(parent.getRequiredPlugins(), ['required']);
      assert.strictEqual(parent.removeRequiredPlugin('required'), true);
      assert.deepStrictEqual(parent.getRequiredPlugins(), []);
    });

    it('should return false when the requested plugin is not required', () => {
      const parent = new Plugger('parent');

      assert.strictEqual(parent.requirePlugin('required'), true);
      assert.deepStrictEqual(parent.getRequiredPlugins(), ['required']);
      assert.strictEqual(parent.removeRequiredPlugin('notRequired'), false);
      assert.deepStrictEqual(parent.getRequiredPlugins(), ['required']);
    });

    it('should throw an error (TypeError) when \'name\' argument is not a string', () => {
      const plugin = new Plugger('plugin');
      const type = [];
      assert.strictEqual(typeof type === 'string' || type instanceof String, false);
      assert.throws(() => {
        plugin.removeRequiredPlugin(type);
      }, TypeError);
    });
  });

  describe('#setInit(func: function)', () => {
    it('should set its own init function', () => {
      const plugin = new Plugger('plugin');
      plugin.setInit(() => true);
    });

    it('should throw an error (TypeError) when \'func\' argument is not a function', () => {
      const plugin = new Plugger('plugin');
      const type = 'string';
      assert.strictEqual(typeof func === 'function', false);
      assert.throws(() => {
        plugin.setInit(type);
      }, TypeError);
    });
  });

  describe('#initPlugin()', () => {
    it('should execute its own init function', () => {
      const plugin = new Plugger('plugin');
      let test = false;

      plugin.setInit(() => { test = true; });
      plugin.initPlugin();
      assert.strictEqual(test, true);
    });

    it('should execute its own init function when loaded', () => {
      const parent = new Plugger('parent');
      const child = new Plugger('child');
      let test = false;

      child.setInit(() => { test = true; });

      parent.addPlugin(child);
      assert.strictEqual(test, true);
    });
  });
});
