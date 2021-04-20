const assert = require('assert');
const Plugger = require('../index');

describe('Plugger', () => {
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
      assert.strictEqual(parent.addPlugin(`${__dirname}/childPlugin`), true);
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
  });

  describe('#requirePlugin(name: string)', () => {
    it('should add the requested plugin requirement', () => {
      const parent = new Plugger('parent');

      assert.strictEqual(parent.requirePlugin('required'), true);
    });
  });

  describe('#removeRequiredPlugin(name: string)', () => {
    it('should remove the requested plugin requirement', () => {
      const parent = new Plugger('parent');

      assert.strictEqual(parent.requirePlugin('required'), true);
      assert.strictEqual(parent.removeRequiredPlugin('required'), true);
      assert.deepStrictEqual(parent.getRequiredPlugins(), []);
    });
  });

  describe('#setInit(func: function)', () => {
    it('should set its own init function', () => {
      const plugin = new Plugger('plugin');
      plugin.setInit(() => true);
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
