/* eslint-disable max-len */
import assert from 'assert';
import path from 'path';
import { AsyncPlugger } from '../index';
import { pluggerProps } from '../constants';

describe('Asynchronous loader functions test', () => {
  describe('AsyncPlugger(name: string)', () => {
    describe('#addFolder(dirName: string)', () => {
      it('should load all plugins in a directory', async () => {
        const parent = new AsyncPlugger('parent');
        await parent.addFolder(path.join(__dirname, 'test-files/addFolder-test-async'));

        ['test1', 'test2', 'test3'].forEach((name) => {
          assert.notStrictEqual(parent.getPlugin(name), null);
        });
      }).timeout(5000);

      it('should support relative paths and load all plugins in a directory', async () => {
        const parent = new AsyncPlugger('parent');

        const currentCwd = process.cwd();
        process.chdir(__dirname);
        await parent.addFolder('./test-files/addFolder-test-async');
        process.chdir(currentCwd);

        ['test1', 'test2', 'test3'].forEach((name) => {
          assert.notStrictEqual(parent.getPlugin(name), null);
        });
      }).timeout(5000);

      it('should support absolute paths and load all plugins in a directory', async () => {
        const parent = new AsyncPlugger('parent');
        await parent.addFolder(path.resolve(__dirname, './test-files/addFolder-test-async'));

        ['test1', 'test2', 'test3'].forEach((name) => {
          assert.notStrictEqual(parent.getPlugin(name), null);
        });
      }).timeout(5000);

      it('should throw an error if the directory does not exist', async () => {
        const parent = new AsyncPlugger('parent');
        await assert.rejects(() => parent.addFolder(path.resolve(__dirname, './test-files/nonexistent')));
      });
    });

    describe('#initPlugin(plugin: AsyncPlugger)', () => {
      it('should initialize the plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);

        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');
      });

      it('should initialize the plugin with a required plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');

        const child2 = new AsyncPlugger('child2');
        child2.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child).addPlugin(child2);
        await parent.initPlugin(child);
        await parent.initPlugin(child2);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), 'initialized');
      });

      it('should initialize the plugin with a required plugin and its metadata', async () => {
        const parent = new AsyncPlugger('parent');

        const requiredMetadata = {
          name: 'child',
          version: '^1.0.0',
          contributors: {
            functions: 'john doe',
            designs: 'jane doe',
          },
        };

        const loadedMetadata = {
          name: 'child',
          version: '1.5.0',
          contributors: {
            functions: 'john doe',
            designs: 'jane doe',
          },
        };

        const child = new AsyncPlugger();
        child.metadata = { ...loadedMetadata };

        const child2 = new AsyncPlugger('child2');
        child2.requirePlugin(requiredMetadata);
        child2.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child).addPlugin(child2);
        await parent.initPlugin(child);
        await parent.initPlugin(child2);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), 'initialized');
      });

      it('should throw an error when \'plugin\' is not loaded', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');

        await assert.rejects(() => parent.initPlugin(child), AsyncPlugger.errorTypes.LoadError);
      });

      it('should throw an error when \'plugin\' is already initialized', async () => {
        const parent = new AsyncPlugger('parent');
        const child = new AsyncPlugger('child');

        parent.addPlugin(child);
        await parent.initPlugin(child);

        await assert.rejects(() => parent.initPlugin(child), AsyncPlugger.errorTypes.InitializeError);
      });

      it('should throw an error when a required plugin(s) is not loaded', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');
        child.requirePlugin({ name: 'nonexistent' });

        parent.addPlugin(child);

        await assert.rejects(() => parent.initPlugin(child), AsyncPlugger.errorTypes.RequirementError);
      });

      it('should throw an error when a required plugin(s) does not match with the metadata of the loaded plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger();
        child.metadata = {
          name: 'child',
          version: '1.0.0',
        };

        const child2 = new AsyncPlugger('child2');
        child2.requirePlugin({ name: 'child', version: '1.0.1' });

        parent.addPlugin(child).addPlugin(child2);

        await assert.rejects(() => parent.initPlugin(child2), AsyncPlugger.errorTypes.RequirementError);
      });

      it('should throw an error when a required plugin(s) is not initialized', async () => {
        const parent = new AsyncPlugger('parent');

        const child1 = new AsyncPlugger('child1');

        const child2 = new AsyncPlugger('child2');
        child2.requirePlugin({ name: 'child1' });

        parent.addPlugin(child1).addPlugin(child2);

        await assert.rejects(() => parent.initPlugin(child2), AsyncPlugger.errorTypes.RequirementError);
      });

      it('should run the default callback function if an uncaught error occured when initializing', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');
        child.pluginCallbacks.init = async () => { throw new Error(); };

        parent.addPlugin(child);

        await assert.rejects(() => parent.initPlugin(child));
      });

      it('should run the callback function if an uncaught error occured when initializing', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');

        let testResult = false;
        child.pluginCallbacks.init = async () => { throw new Error(); };
        child.pluginCallbacks.error = async (event, error) => {
          assert.strictEqual(event, 'init');
          testResult = true;
          return error;
        };

        parent.addPlugin(child);

        await assert.rejects(() => parent.initPlugin(child));
        assert.strictEqual(testResult, true);
      });

      it('should be able to ignore if an uncaught error occured when initializing', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');

        let testResult = false;
        child.pluginCallbacks.init = async () => { throw new Error(); };
        child.pluginCallbacks.error = async (event) => {
          assert.strictEqual(event, 'init');
          testResult = true;
          return null;
        };

        parent.addPlugin(child);

        await assert.doesNotReject(() => parent.initPlugin(child));
        assert.strictEqual(testResult, true);
      });
    });

    describe('#initAll()', () => {
      it('should initialize all loaded plugins', async () => {
        const parent = new AsyncPlugger('parent');

        const child1 = new AsyncPlugger('child1');

        const child2 = new AsyncPlugger('child2');
        child2.requirePlugin({ name: 'child1' });
        child2.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child1).addPlugin(child2);

        await assert.doesNotReject(() => parent.initAll());

        assert.strictEqual(child1.getStatus(), 'initialized');
        assert.strictEqual(child1.isInitialized(), true);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), 'initialized');
      });

      it('should not initialize a plugin twice', async () => {
        const parent = new AsyncPlugger('parent');

        const child1 = new AsyncPlugger('child1');
        const child2 = new AsyncPlugger('child2');

        const testResult = [];
        child2.pluginCallbacks.init = async () => { testResult.push('initialized'); };

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initPlugin(child2);

        await assert.doesNotReject(() => parent.initAll());

        assert.strictEqual(child1.getStatus(), 'initialized');
        assert.strictEqual(child1.isInitialized(), true);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(testResult.length, 1);
      });
    });

    describe('#shutdownPlugin(plugin: AsyncPlugger)', () => {
      it('should shutdown the plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');
        child.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        let shutdownTest = false;

        child.pluginCallbacks.shutdown = async () => { shutdownTest = true; };

        await parent.shutdownPlugin(child);

        assert.strictEqual(shutdownTest, true);
        assert.notStrictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), false);
      });

      it('should throw an error when \'plugin\' is not loaded', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');

        await assert.rejects(() => parent.shutdownPlugin(child), AsyncPlugger.errorTypes.LoadError);
      });

      it('should throw an error when \'plugin\' is required by at least one initialized plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child1 = new AsyncPlugger('child1');

        const child2 = new AsyncPlugger('child2');
        child2.requirePlugin({ name: 'child1' });

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initAll();

        await assert.rejects(() => parent.shutdownPlugin(child1), AsyncPlugger.errorTypes.RequirementError);
      });

      it('should throw an error when \'plugin\' is not initialized', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');

        parent.addPlugin(child);

        await assert.rejects(() => parent.shutdownPlugin(child), AsyncPlugger.errorTypes.InitializeError);
      });

      it('should run the default callback function if an uncaught error occured when shutting down the plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');
        child.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        child.pluginCallbacks.shutdown = async () => { throw new Error(); };

        await assert.rejects(() => parent.shutdownPlugin(child));
      });

      it('should run the callback function if an uncaught error occured when shutting down the plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');
        child.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        let testResult = false;
        child.pluginCallbacks.shutdown = async () => { throw new Error(); };
        child.pluginCallbacks.error = async (event, error) => {
          assert.strictEqual(event, 'shutdown');
          testResult = true;
          return error;
        };

        await assert.rejects(() => parent.shutdownPlugin(child));
        assert.strictEqual(testResult, true);
      });

      it('should be able to ignore if an uncaught error occured when shutting down the plugin', async () => {
        const parent = new AsyncPlugger('parent');

        const child = new AsyncPlugger('child');
        child.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        let testResult = false;
        child.pluginCallbacks.shutdown = async () => { throw new Error(); };
        child.pluginCallbacks.error = async (event) => {
          assert.strictEqual(event, 'shutdown');
          testResult = true;
          return null;
        };

        await assert.doesNotReject(() => parent.shutdownPlugin(child));
        assert.strictEqual(testResult, true);
      });
    });

    describe('#shutdownAll()', () => {
      it('should shutdown all initialized plugins', async () => {
        const parent = new AsyncPlugger('parent');

        const child1 = new AsyncPlugger('child1');
        const child2 = new AsyncPlugger('child2');

        child2.requirePlugin({ name: 'child1' });
        child2.pluginCallbacks.init = async () => 'initialized';

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initPlugin(child1);
        await parent.initPlugin(child2);

        [child1, child2].forEach((plugin) => {
          assert.strictEqual(plugin.getStatus(), 'initialized');
          assert.strictEqual(plugin.isInitialized(), true);
        });

        assert.strictEqual(child2.getState(), 'initialized');

        await parent.shutdownAll();

        [child1, child2].forEach((plugin) => {
          assert.notStrictEqual(plugin.getStatus(), 'initialized');
          assert.strictEqual(plugin.isInitialized(), false);
          assert.strictEqual(plugin.getState(), null);
        });
      });

      it('should not shutdown uninitialized plugins', async () => {
        const parent = new AsyncPlugger('parent');

        const child1 = new AsyncPlugger('child1');
        const child2 = new AsyncPlugger('child2');

        let testResult = true;
        /* istanbul ignore next */
        child2.pluginCallbacks.shutdown = async () => { testResult = false; };

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initPlugin(child1);

        assert.notStrictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), false);

        await assert.doesNotReject(() => parent.shutdownAll());
        assert.strictEqual(testResult, true);
      });
    });

    describe('#attachExitListener()', () => {
      it('should attach an exit event', () => {
        const plugin = new AsyncPlugger('plugin');
        plugin.attachExitListener();

        const exitEvents = ['exit', 'SIGINT', 'SIGTERM', 'SIGQUIT'];

        exitEvents.forEach((event) => {
          assert.strictEqual(
            // @ts-ignore
            process.listeners(event).includes(plugin[pluggerProps].exitListener!), true,
          );
        });
      });

      it('should do nothing if there is already a listener', () => {
        const plugin = new AsyncPlugger('plugin');

        plugin.attachExitListener();

        assert.doesNotThrow(() => { plugin.attachExitListener(); });

        const exitEvents = ['exit', 'SIGINT', 'SIGTERM', 'SIGQUIT'];

        exitEvents.forEach((event) => {
          assert.strictEqual(
            // @ts-ignore
            process.listeners(event).filter((e) => e === plugin[pluggerProps].exitListener!).length, 1,
          );
        });
      });
    });

    describe('#detachExitListener()', () => {
      it('should detach an exit event', () => {
        const plugin = new AsyncPlugger('plugin');
        plugin.attachExitListener();

        const exitEvents = ['exit', 'SIGINT', 'SIGTERM', 'SIGQUIT'];

        exitEvents.forEach((event) => {
          assert.strictEqual(
            // @ts-ignore
            process.listeners(event).includes(plugin[pluggerProps].exitListener!), true,
          );
        });

        plugin.detachExitListener();
        exitEvents.forEach((event) => {
          assert.strictEqual(
            // @ts-ignore
            process.listeners(event).includes(plugin[pluggerProps].exitListener!), false,
          );
        });
      });

      it('should do nothing if there is no listener', () => {
        const plugin = new AsyncPlugger('plugin');
        assert.doesNotThrow(() => { plugin.detachExitListener(); });
      });
    });
  });
});
