const assert = require('assert');
const Plugger = require('../index');

const parent = new Plugger('parent');
const child = new Plugger('child');
const childSameName = new Plugger('child');
const child2 = new Plugger('child2');
child2.requirePlugin('required');
const requiredPlugin = new Plugger('required');

describe('Plugger', () => {
  describe('#getName()', () => {
    it('should return the plugin\'s name', () => {
      assert.strictEqual(parent.getName(), 'parent');
    });
  });

  describe('#setName(name: string)', () => {
    it('should change the plugin\'s name properly', () => {
      parent.setName('new_name');
      assert.strictEqual(parent.getName(), 'new_name');
    });
  });

  describe('#addPlugin(plugin: Plugger | string)', () => {
    it('should load a plugin from its instance (plugin: Plugger)', () => {
      assert.strictEqual(parent.addPlugin(child), true);
      assert.strictEqual(child.getParent(), parent);
    });

    it('should load a plugin from its module path (plugin: string)', () => {
      assert.strictEqual(parent.addPlugin(`${__dirname}/childPlugin`), true);
    });

    it('should load a plugin when its required plugin(s) is loaded', () => {
      assert.strictEqual(parent.addPlugin(requiredPlugin), true);
      assert.strictEqual(parent.addPlugin(child2), true);
      assert.strictEqual(child2.getParent(), parent);
    });

    it('should throw an error when a required plugin(s) is not loaded', () => {
      let result;
      try {
        parent.addPlugin(child2);
        result = 'Plugin loaded';
      } catch (err) {
        result = 'Error thrown';
      }
      assert.strictEqual(result, 'Error thrown');
    });

    it('should throw an error when another plugin with the same name is already loaded', () => {
      let result;
      try {
        parent.addPlugin(childSameName);
        result = 'Plugin loaded';
      } catch (err) {
        result = 'Error thrown';
      }
      assert.strictEqual(result, 'Error thrown');
    });
  });

  describe('#getPlugin(name: string)', () => {
    it('should return the requested loaded plugin', () => {
      assert.strictEqual(parent.getPlugin('child'), child);
    });

    it('should return null when the requested plugin is not loaded', () => {
      assert.strictEqual(parent.getPlugin('nonexistent'), null);
    });
  });

  describe('#removePlugin(plugin: Plugger | string)', () => {
    it('should unload the requested loaded plugin', () => {
      assert.strictEqual(parent.removePlugin(child), true);
      assert.strictEqual(child.getParent(), null);
    });

    it('should throw an error when the requested plugin is not loaded', () => {
      let result;
      try {
        parent.removePlugin('nonexistent');
        result = 'Plugin removed';
      } catch (err) {
        result = 'Error thrown';
      }
      assert.strictEqual(result, 'Error thrown');
    });
  });

  describe('#requirePlugin(name: string)', () => {
    it('should add the requested plugin requirement', () => {
      assert.strictEqual(parent.requirePlugin('required'), true);
    });
  });

  describe('#removeRequiredPlugin(name: string)', () => {
    it('should remove the requested plugin requirement', () => {
      parent.removeRequiredPlugin('required');
      assert.deepStrictEqual(parent.getRequiredPlugins(), []);
    });
  });

  const child3 = new Plugger('child_test');
  let testString = 'Init function not executed';

  describe('#setInit(func: function)', () => {
    it('should set its own init function', () => {
      child3.setInit(() => { testString = 'Init function executed'; });
    });
  });

  describe('#initPlugin()', () => {
    it('should execute its own init function', () => {
      child3.initPlugin();
      assert.strictEqual(testString, 'Init function executed');
    });

    testString = 'Init function not executed';

    it('should execute its own init function when loaded', () => {
      parent.addPlugin(child3);
      assert.strictEqual(testString, 'Init function executed');
    });
  });
});
