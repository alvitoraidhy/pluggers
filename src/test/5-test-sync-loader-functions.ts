/* eslint-disable max-len */
import assert from 'assert';
import path from 'path';
import { Plugger } from '../index';
import { pluggerProps } from '../constants';

describe('Synchronous loader functions test', () => {
  describe('Plugger(name: string)', () => {
    describe('#addFolder(dirName: string)', () => {
      it('should load all plugins in a directory', () => {
        const parent = new Plugger('parent');
        parent.addFolder(path.join(__dirname, 'test-files/addFolder-test-sync'));

        ['test1', 'test2', 'test3'].forEach((name) => {
          assert.notStrictEqual(parent.getPlugin(name), null);
        });
      }).timeout(5000);

      it('should support relative paths and load all plugins in a directory', () => {
        const parent = new Plugger('parent');

        const currentCwd = process.cwd();
        process.chdir(__dirname);
        parent.addFolder('./test-files/addFolder-test-sync');
        process.chdir(currentCwd);

        ['test1', 'test2', 'test3'].forEach((name) => {
          assert.notStrictEqual(parent.getPlugin(name), null);
        });
      }).timeout(5000);

      it('should support absolute paths and load all plugins in a directory', () => {
        const parent = new Plugger('parent');
        parent.addFolder(path.resolve(__dirname, './test-files/addFolder-test-sync'));

        ['test1', 'test2', 'test3'].forEach((name) => {
          assert.notStrictEqual(parent.getPlugin(name), null);
        });
      }).timeout(5000);

      it('should throw an error if the directory does not exist', () => {
        const parent = new Plugger('parent');
        assert.throws(() => { parent.addFolder(path.resolve(__dirname, './test-files/nonexistent')); });
      });
    });

    describe('#initPlugin(plugin: Plugger)', () => {
      it('should initialize the plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);

        parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');
      });

      it('should initialize the plugin with a required plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        const child2 = new Plugger('child2');
        child2.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child).addPlugin(child2);
        parent.initPlugin(child).initPlugin(child2);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), 'initialized');
      });

      it('should initialize the plugin with a required plugin and its metadata', () => {
        const parent = new Plugger('parent');

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

        const child = new Plugger();
        child.metadata = { ...loadedMetadata };

        const child2 = new Plugger('child2');
        child2.requirePlugin(requiredMetadata);
        child2.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child).addPlugin(child2);
        parent.initPlugin(child).initPlugin(child2);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), 'initialized');
      });

      it('should throw an error when \'plugin\' is not loaded', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        assert.throws(() => { parent.initPlugin(child); }, Plugger.errorTypes.LoadError);
      });

      it('should throw an error when \'plugin\' is already initialized', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');

        parent.addPlugin(child).initPlugin(child);

        assert.throws(() => { parent.initPlugin(child); }, Plugger.errorTypes.InitializeError);
      });

      it('should throw an error when a required plugin(s) is not loaded', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.requirePlugin({ name: 'nonexistent' });

        parent.addPlugin(child);

        assert.throws(() => { parent.initPlugin(child); }, Plugger.errorTypes.RequirementError);
      });

      it('should throw an error when a required plugin(s) does not match with the metadata of the loaded plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger();
        child.metadata = {
          name: 'child',
          version: '1.0.0',
        };

        const child2 = new Plugger('child2');
        child2.requirePlugin({ name: 'child', version: '1.0.1' });

        parent.addPlugin(child).addPlugin(child2);

        assert.throws(() => { parent.initPlugin(child2); }, Plugger.errorTypes.RequirementError);
      });

      it('should throw an error when a required plugin(s) is not initialized', () => {
        const parent = new Plugger('parent');

        const child1 = new Plugger('child1');

        const child2 = new Plugger('child2');
        child2.requirePlugin({ name: 'child1' });

        parent.addPlugin(child1).addPlugin(child2);

        assert.throws(() => { parent.initPlugin(child2); }, Plugger.errorTypes.RequirementError);
      });

      it('should run the default callback function if an uncaught error occured when initializing', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => { throw new Error(); };

        parent.addPlugin(child);

        assert.throws(() => { parent.initPlugin(child); });
      });

      it('should run the callback function if an uncaught error occured when initializing', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        let testResult = false;
        child.pluginCallbacks.init = () => { throw new Error(); };
        child.pluginCallbacks.error = (event, error) => {
          assert.strictEqual(event, 'init');
          testResult = true;
          return error;
        };

        parent.addPlugin(child);

        assert.throws(() => { parent.initPlugin(child); });
        assert.strictEqual(testResult, true);
      });

      it('should be able to ignore if an uncaught error occured when initializing', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        let testResult = false;
        child.pluginCallbacks.init = () => { throw new Error(); };
        child.pluginCallbacks.error = (event) => {
          assert.strictEqual(event, 'init');
          testResult = true;
          return null;
        };

        parent.addPlugin(child);

        assert.doesNotThrow(() => { parent.initPlugin(child); });
        assert.strictEqual(testResult, true);
      });
    });

    describe('#initAll()', () => {
      it('should initialize all loaded plugins', () => {
        const parent = new Plugger('parent');

        const child1 = new Plugger('child1');

        const child2 = new Plugger('child2');
        child2.requirePlugin({ name: 'child1' });
        child2.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child1).addPlugin(child2);

        assert.doesNotThrow(() => { parent.initAll(); });

        assert.strictEqual(child1.getStatus(), 'initialized');
        assert.strictEqual(child1.isInitialized(), true);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), 'initialized');
      });

      it('should not initialize a plugin twice', () => {
        const parent = new Plugger('parent');

        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');

        const testResult = [];
        child2.pluginCallbacks.init = () => { testResult.push('initialized'); };

        parent.addPlugin(child1).addPlugin(child2);
        parent.initPlugin(child2);

        assert.doesNotThrow(() => { parent.initAll(); });

        assert.strictEqual(child1.getStatus(), 'initialized');
        assert.strictEqual(child1.isInitialized(), true);

        assert.strictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(testResult.length, 1);
      });
    });

    describe('#shutdownPlugin(plugin: Plugger)', () => {
      it('should shutdown the plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child).initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        let shutdownTest = false;

        child.pluginCallbacks.shutdown = () => { shutdownTest = true; };

        parent.shutdownPlugin(child);

        assert.strictEqual(shutdownTest, true);
        assert.notStrictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), false);
      });

      it('should throw an error when \'plugin\' is not loaded', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        assert.throws(() => { parent.shutdownPlugin(child); }, Plugger.errorTypes.LoadError);
      });

      it('should throw an error when \'plugin\' is required by at least one initialized plugin', () => {
        const parent = new Plugger('parent');

        const child1 = new Plugger('child1');

        const child2 = new Plugger('child2');
        child2.requirePlugin({ name: 'child1' });

        parent.addPlugin(child1).addPlugin(child2);
        parent.initAll();

        assert.throws(() => {
          parent.shutdownPlugin(child1);
        }, Plugger.errorTypes.RequirementError);
      });

      it('should throw an error when \'plugin\' is not initialized', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        parent.addPlugin(child);

        assert.throws(() => {
          parent.shutdownPlugin(child);
        }, Plugger.errorTypes.InitializeError);
      });

      it('should run the default callback function if an uncaught error occured when shutting down the plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);
        parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        child.pluginCallbacks.shutdown = () => { throw new Error(); };

        assert.throws(() => { parent.shutdownPlugin(child); });
      });

      it('should run the callback function if an uncaught error occured when shutting down the plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);
        parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        let testResult = false;
        child.pluginCallbacks.shutdown = () => { throw new Error(); };
        child.pluginCallbacks.error = (event, error) => {
          assert.strictEqual(event, 'shutdown');
          testResult = true;
          return error;
        };

        assert.throws(() => { parent.shutdownPlugin(child); });
        assert.strictEqual(testResult, true);
      });

      it('should be able to ignore if an uncaught error occured when shutting down the plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);
        parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), 'initialized');
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), 'initialized');

        let testResult = false;
        child.pluginCallbacks.shutdown = () => { throw new Error(); };
        child.pluginCallbacks.error = (event) => {
          assert.strictEqual(event, 'shutdown');
          testResult = true;
          return null;
        };

        assert.doesNotThrow(() => { parent.shutdownPlugin(child); });
        assert.strictEqual(testResult, true);
      });
    });

    describe('#shutdownAll()', () => {
      it('should shutdown all initialized plugins', () => {
        const parent = new Plugger('parent');

        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');

        child2.requirePlugin({ name: 'child1' });
        child2.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child1).addPlugin(child2);
        parent.initPlugin(child1).initPlugin(child2);

        [child1, child2].forEach((plugin) => {
          assert.strictEqual(plugin.getStatus(), 'initialized');
          assert.strictEqual(plugin.isInitialized(), true);
        });

        assert.strictEqual(child2.getState(), 'initialized');

        parent.shutdownAll();

        [child1, child2].forEach((plugin) => {
          assert.notStrictEqual(plugin.getStatus(), 'initialized');
          assert.strictEqual(plugin.isInitialized(), false);
          assert.strictEqual(plugin.getState(), null);
        });
      });

      it('should not shutdown uninitialized plugins', () => {
        const parent = new Plugger('parent');

        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');

        let testResult = true;
        /* istanbul ignore next */
        child2.pluginCallbacks.shutdown = () => { testResult = false; };

        parent.addPlugin(child1).addPlugin(child2);
        parent.initPlugin(child1);

        assert.notStrictEqual(child2.getStatus(), 'initialized');
        assert.strictEqual(child2.isInitialized(), false);
        assert.doesNotThrow(() => { parent.shutdownAll(); });
        assert.strictEqual(testResult, true);
      });
    });

    describe('#attachExitListener()', () => {
      it('should attach an exit event', () => {
        const plugin = new Plugger('plugin');
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
        const plugin = new Plugger('plugin');

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
        const plugin = new Plugger('plugin');
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
        const plugin = new Plugger('plugin');
        assert.doesNotThrow(() => { plugin.detachExitListener(); });
      });
    });
  });
});
