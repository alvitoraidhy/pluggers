import assert from 'assert';
import Plugger from '../index';

describe('Plugin functions test', () => {
  describe('Plugger(name: string)', () => {
    describe('#getName()', () => {
      it('should return the plugin\'s name', () => {
        const name = 'plugin';
        const plugin = new Plugger(name);
        assert.strictEqual(plugin.getName(), name);
      });
    });

    describe('#requirePlugin(name: string)', () => {
      it('should add the plugin as a requirement requirement without a problem', () => {
        const parent = new Plugger('parent');
        assert.doesNotThrow(() => {
          parent.requirePlugin('required');
        });
      });

      it('should throw an error (ConflictError) when the plugin is already required', () => {
        const parent = new Plugger('parent');

        const requiredPluginName = 'required';
        parent.requirePlugin(requiredPluginName);

        assert.throws(() => {
          parent.requirePlugin(requiredPluginName);
        }, Plugger.errorTypes.ConflictError);
      });
    });

    describe('#removeRequiredPlugin(name: string)', () => {
      it('should remove the plugin from requirement', () => {
        const parent = new Plugger('parent');

        const requiredPluginName = 'required';
        parent.requirePlugin(requiredPluginName);

        assert.doesNotThrow(() => {
          parent.removeRequiredPlugin(requiredPluginName);
        });
      });

      it('should throw an error (RequirementError) when the plugin is not required', () => {
        const parent = new Plugger('parent');

        assert.throws(() => {
          parent.removeRequiredPlugin('notRequired');
        }, Plugger.errorTypes.RequirementError);
      });
    });

    describe('#getRequiredPlugins()', () => {
      it('should return the appropriate default value', () => {
        const plugin = new Plugger('plugin');
        const requiredPlugins = plugin.getRequiredPlugins();
        assert.deepStrictEqual(requiredPlugins, []);
      });

      it('should return the correct required plugins when a plugin(s) is added as a requirement', () => {
        const plugin = new Plugger('plugin');
        const pluginRequirements: string[] = [
          'plugin1',
          'plugin2',
          'plugin3',
          'plugin7',
        ];

        pluginRequirements.forEach((requiredPlugin) => plugin.requirePlugin(requiredPlugin));
        const requiredPlugins = plugin.getRequiredPlugins();

        assert.deepStrictEqual(requiredPlugins, pluginRequirements);
      });

      it('should return the correct required plugins when a plugin(s) is added and removed as a requirement', () => {
        const plugin = new Plugger('plugin');
        const optionalPlugins: string[] = [
          'plugin1',
          'plugin3',
        ];

        const pluginRequirements: string[] = [
          'plugin2',
          'plugin7',
        ];

        const combinedArr = [...optionalPlugins, ...pluginRequirements];

        // Add both optional and required plugins
        combinedArr.forEach((requiredPlugin) => plugin.requirePlugin(requiredPlugin));
        assert.deepStrictEqual(plugin.getRequiredPlugins(), combinedArr);

        // Remove optional plugins from requirement
        optionalPlugins.forEach((optionalPlugin) => plugin.removeRequiredPlugin(optionalPlugin));
        assert.deepStrictEqual(plugin.getRequiredPlugins(), pluginRequirements);
      });
    });

    describe('#setInit(func: function)', () => {
      it('should set the plugin\'s init function', () => {
        const plugin = new Plugger('plugin');
        assert.doesNotThrow(() => {
          plugin.setInit(() => {});
        });
      });
    });

    describe('#getInit()', () => {
      it('should return the plugin\'s init function', () => {
        const plugin = new Plugger('plugin');

        const initFunc = () => {};
        plugin.setInit(initFunc);

        assert.strictEqual(plugin.getInit(), initFunc);
      });
    });
  });
});