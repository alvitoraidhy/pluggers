import assert from 'assert';
import Plugger from '../index';

describe('Plugin functions test', () => {
  describe('Plugger(name: string)', () => {
    describe('#selfInit(pluginsStates?: { [key: string]: any })', () => {
      it('should initialize the plugin', async () => {
        const plugin = new Plugger('plugin');

        const state = 'initialized state';
        plugin.pluginCallbacks.init = async () => state;

        await plugin.selfInit();

        assert.strictEqual(plugin.getStatus(), 'initialized');
        assert.strictEqual(plugin.isInitialized(), true);
        assert.strictEqual(plugin.getState(), state);
      });

      it('should throw the error when an error occured while initializing', async () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.init = async () => { throw new Error(); };

        await assert.rejects(() => plugin.selfInit());
      });

      it('should be able to ignore the error when an error occured while initializing', async () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.init = async () => { throw new Error(); };
        plugin.pluginCallbacks.error = async () => null;

        await assert.doesNotReject(() => plugin.selfInit());
      });
    });

    describe('#selfShutdown()', () => {
      it('should shutdown the plugin', async () => {
        const plugin = new Plugger('plugin');

        const state = 'initialized state';
        plugin.pluginCallbacks.init = async () => state;

        await plugin.selfInit();

        assert.strictEqual(plugin.getStatus(), 'initialized');
        assert.strictEqual(plugin.isInitialized(), true);
        assert.strictEqual(plugin.getState(), state);

        plugin.pluginCallbacks.shutdown = async (selfState: string) => {
          assert.strictEqual(selfState, state);
        };

        await plugin.selfShutdown();

        assert.strictEqual(plugin.getStatus(), 'ready');
        assert.strictEqual(plugin.isInitialized(), false);
        assert.strictEqual(plugin.getState(), null);
      });

      it('should throw the error when an error occured while shutting down', async () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.shutdown = async () => { throw new Error(); };

        await assert.rejects(() => plugin.selfShutdown());
      });

      it('should be able to ignore the error when an error occured while shutting down', async () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.shutdown = async () => { throw new Error(); };
        plugin.pluginCallbacks.error = async () => null;

        await assert.doesNotReject(() => plugin.selfShutdown());
      });
    });
  });
});
