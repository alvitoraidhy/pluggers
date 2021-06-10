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

    describe('#getContext()', () => {
      it('should be persistent during runtime', () => {
        const plugin = new Plugger('plugin');
        const ctx = plugin.getContext();

        const someProperty = 'someValue';
        ctx.someProperty = someProperty;
        assert.strictEqual(ctx.someProperty, someProperty);

        const ctx2 = plugin.getContext();
        assert.strictEqual(ctx2, ctx);
        assert.deepStrictEqual(ctx2, ctx);
        assert.strictEqual(ctx2.someProperty, someProperty);
      });

      it('should be different between plugins', () => {
        const plugin1 = new Plugger('plugin1');
        const plugin2 = new Plugger('plugin2');

        assert.notStrictEqual(plugin1.getContext(), plugin2.getContext());
      });
    });

    describe('#requirePlugin(name: string, metadata?: object)', () => {
      it('should add the plugin as a requirement without metadata', () => {
        const parent = new Plugger('parent');
        assert.doesNotThrow(() => {
          parent.requirePlugin('required');
        });
      });

      it('should add the plugin as a requirement with metadata', () => {
        const parent = new Plugger('parent');
        assert.doesNotThrow(() => {
          parent.requirePlugin('required', { version: '1.0.0' });
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
        const requiredPlugins = plugin.getRequiredPlugins().reduce((acc: string[], e) => {
          acc.push(e.name);
          return acc;
        }, []);

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
        combinedArr.forEach((requiredPlugin) => {
          plugin.requirePlugin(requiredPlugin);
          const requiredPlugins = plugin.getRequiredPlugins();
          assert.strictEqual(requiredPlugins.some((x) => x.name === requiredPlugin), true);
        });

        // Remove optional plugins from requirement
        optionalPlugins.forEach((optionalPlugin) => {
          plugin.removeRequiredPlugin(optionalPlugin);
          const requiredPlugins = plugin.getRequiredPlugins();
          assert.strictEqual(requiredPlugins.some((x) => x.name === optionalPlugin), false);
        });
      });
    });
  });
});
