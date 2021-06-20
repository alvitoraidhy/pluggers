import assert from 'assert';
import { Plugger } from '../index';

describe('Synchronous plugin functions test', () => {
  describe('Plugger(name: string)', () => {
    describe('#selfInit(pluginsStates?: { [key: string]: any })', () => {
      it('should initialize the plugin', () => {
        const plugin = new Plugger('plugin');

        const state = 'initialized state';
        plugin.pluginCallbacks.init = () => state;

        plugin.selfInit();

        assert.strictEqual(plugin.getStatus(), 'initialized');
        assert.strictEqual(plugin.isInitialized(), true);
        assert.strictEqual(plugin.getState(), state);
      });

      it('should throw the error when an error occured while initializing', () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.init = () => { throw new Error(); };

        assert.throws(() => { plugin.selfInit(); });
      });

      it('should be able to ignore the error when an error occured while initializing', () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.init = () => { throw new Error(); };
        plugin.pluginCallbacks.error = () => null;

        assert.doesNotThrow(() => { plugin.selfInit(); });
      });
    });

    describe('#selfShutdown()', () => {
      it('should shutdown the plugin', () => {
        const plugin = new Plugger('plugin');

        const state = 'initialized state';
        plugin.pluginCallbacks.init = () => state;

        plugin.selfInit();

        assert.strictEqual(plugin.getStatus(), 'initialized');
        assert.strictEqual(plugin.isInitialized(), true);
        assert.strictEqual(plugin.getState(), state);

        plugin.pluginCallbacks.shutdown = (selfState: string) => {
          assert.strictEqual(selfState, state);
        };

        plugin.selfShutdown();

        assert.strictEqual(plugin.getStatus(), 'ready');
        assert.strictEqual(plugin.isInitialized(), false);
        assert.strictEqual(plugin.getState(), null);
      });

      it('should throw the error when an error occured while shutting down', () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.shutdown = () => { throw new Error(); };

        assert.throws(() => { plugin.selfShutdown(); });
      });

      it('should be able to ignore the error when an error occured while shutting down', () => {
        const plugin = new Plugger('plugin');

        plugin.pluginCallbacks.shutdown = () => { throw new Error(); };
        plugin.pluginCallbacks.error = () => null;

        assert.doesNotThrow(() => { plugin.selfShutdown(); });
      });
    });
  });
});
