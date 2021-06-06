import assert from 'assert';
import Plugger from '../index';

describe('Loader functions test', () => {
  describe('Plugger(name: string)', () => {
    describe('#addPlugin(plugin: Plugger, { priority: number = defaultPriority) }', () => {
      it('should load a plugin from its instance', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');
        assert.doesNotThrow(() => {
          parent.addPlugin(child);
        });
      });

      it('should load a plugin when its required plugin(s) is loaded', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');

        const requiredPlugin = new Plugger('requiredPlugin');
        child.requirePlugin('requiredPlugin');
        parent.addPlugin(requiredPlugin);

        assert.doesNotThrow(() => {
          parent.addPlugin(child);
        });
      });

      it('should load a plugin from its instance with explicit priority (priority !== defaultPriority)', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');
        assert.doesNotThrow(() => {
          parent.addPlugin(child, { priority: 10 });
        });
      });

      it('should initialize the plugin automatically if loader.loaderConfig.autoInit === true', () => {
        const parent = new Plugger('parent');
        parent.loaderConfig.autoInit = true;

        const child = new Plugger('child');

        let result = false;
        child.pluginCallbacks.init = () => { result = true; return result; };
        parent.addPlugin(child);

        assert.strictEqual(result, true);
        assert.strictEqual(parent.getState(child).state, true);
        assert.strictEqual(parent.getState(child).isInitialized, true);
      });

      it('should not initialize the plugin automatically if loader.loaderConfig.autoInit === false', () => {
        const parent = new Plugger('parent');
        parent.loaderConfig.autoInit = false;

        const child = new Plugger('child');

        parent.addPlugin(child);

        const state = parent.getState(child);
        assert.strictEqual(state.isInitialized, false);
        assert.strictEqual(state.state, null);
      });

      it('should throw an error (RequirementError) when a required plugin(s) is not loaded', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');
        child.requirePlugin('requiredPlugin');
        assert.throws(() => {
          parent.addPlugin(child);
        }, Plugger.errorTypes.RequirementError);
      });

      it('should throw an error (ConflictError) when another plugin with the same name is already loaded', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');
        const childSameName = new Plugger(child.getName());

        parent.addPlugin(child);

        assert.throws(() => {
          parent.addPlugin(childSameName);
        }, Plugger.errorTypes.ConflictError);
      });
    });

    describe('#getPlugin(name: string)', () => {
      it('should return the requested loaded plugin', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');
        parent.addPlugin(child);

        assert.strictEqual(parent.getPlugin('child'), child);
      });

      it('should return null when the requested plugin is not loaded', () => {
        const parent = new Plugger('parent');
        assert.strictEqual(parent.getPlugin('nonexistent'), null);
      });
    });

    describe('#getPlugins()', () => {
      it('should return all loaded plugins', () => {
        const parent = new Plugger('parent');
        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');
        parent.addPlugin(child1);
        parent.addPlugin(child2);

        const plugins: { [key: string]: Plugger } = {
          [child1.getName()]: child1,
          [child2.getName()]: child2,
        };

        assert.deepStrictEqual(parent.getPlugins(), plugins);
      });
    });

    describe('#removePlugin(plugin: Plugger)', () => {
      it('should unload the requested loaded plugin', () => {
        const parent = new Plugger('parent');

        const childName = 'child';
        const child = new Plugger(childName);
        parent.addPlugin(child);

        assert.doesNotThrow(() => parent.removePlugin(child));
        assert.strictEqual(parent.getPlugin(childName), null);
      });

      it('should throw an error (NotLoadedError) when the requested plugin is not loaded', () => {
        const parent = new Plugger('parent');
        const notLoadedChild = new Plugger('child');

        assert.throws(() => {
          parent.removePlugin(notLoadedChild);
        }, Plugger.errorTypes.NotLoadedError);
      });
    });

    describe('#getState(plugin: Plugger)', () => {
      it('should return the plugin\'s state', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');

        parent.addPlugin(child);

        assert.doesNotThrow(() => {
          const state = parent.getState(child);
          assert.strictEqual(state.instance, child);
        });
      });

      it('should throw an error (NotLoadedError) if the plugin is not loaded', () => {
        const parent = new Plugger('parent');
        const child = new Plugger('child');

        assert.throws(() => parent.getState(child), Plugger.errorTypes.NotLoadedError);
      });
    });

    describe('#getStates()', () => {
      it('should return empty array if no plugin is loaded', () => {
        const parent = new Plugger('parent');
        const states = parent.getStates();

        assert.deepStrictEqual(states, []);
      });

      it('should return all loaded plugins\' states', () => {
        const parent = new Plugger('parent');
        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');

        parent.addPlugin(child1);
        parent.addPlugin(child2);

        const states = parent.getStates();

        assert.notStrictEqual(states.find((x) => x.instance === child1), undefined);
        assert.notStrictEqual(states.find((x) => x.instance === child2), undefined);
      });
    });

    describe('#getLoadOrder()', () => {
      it('should return the correct load order with undefined priorities', () => {
        const parent = new Plugger('parent');
        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');
        const child3 = new Plugger('child3');
        const child4 = new Plugger('child4');

        parent.addPlugin(child3);
        parent.addPlugin(child1);
        parent.addPlugin(child4);
        parent.addPlugin(child2);

        parent.removePlugin(child4);

        const expectedLoadOrder = [child3.getName(), child1.getName(), child2.getName()];
        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.getName());
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it('should return the correct load order with default priorities', () => {
        const parent = new Plugger('parent');
        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');
        const child3 = new Plugger('child3');
        const child4 = new Plugger('child4');

        child1.pluginConfig.defaultPriority = 10;
        child2.pluginConfig.defaultPriority = 0;
        child3.pluginConfig.defaultPriority = 7;
        child4.pluginConfig.defaultPriority = 10;

        parent.addPlugin(child1);
        parent.addPlugin(child2);
        parent.addPlugin(child3);
        parent.addPlugin(child4);

        const expectedLoadOrder = [
          child2.getName(), child3.getName(), child1.getName(), child4.getName(),
        ];

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.getName());
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it('should return the correct load order with explicit priorities', () => {
        const parent = new Plugger('parent');
        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');
        const child3 = new Plugger('child3');
        const child4 = new Plugger('child4');

        // Before: child3, child1, child2
        child1.pluginConfig.defaultPriority = 5;
        child2.pluginConfig.defaultPriority = 7;
        child3.pluginConfig.defaultPriority = 3;

        // After: child1, child4, child3, child2
        parent.addPlugin(child2, { priority: -1 });
        parent.addPlugin(child3);
        parent.addPlugin(child1, { priority: 0 });
        parent.addPlugin(child4, { priority: -2 });

        const expectedLoadOrder = [
          child1.getName(),
          child4.getName(),
          child3.getName(),
          child2.getName(),
        ];

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.getName());
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it('should handle out-of-bounds negative array index value correctly', () => {
        const parent = new Plugger('parent');
        const child1 = new Plugger('child1');
        const child2 = new Plugger('child2');

        parent.addPlugin(child1);
        parent.addPlugin(child2, { priority: -10 });

        const expectedLoadOrder = [
          child2.getName(),
          child1.getName(),
        ];

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.getName());
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });
    });

    describe('#sortLoadOrder()', () => {
      it('should sort the load order with undefined priorities', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child1 = (new Plugger('child1')).requirePlugin('child2');
        const child2 = new Plugger('child2');
        const child3 = (new Plugger('child3')).requirePlugin('child1');

        parent.addPlugin(child3);
        parent.addPlugin(child1);
        parent.addPlugin(child2);

        const expectedLoadOrder = [
          child2.getName(),
          child1.getName(),
          child3.getName(),
        ];

        parent.sortLoadOrder();

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.getName());
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it('should sort the load order with defined priorities', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        // Expected load order: child1, child4, child2, child3
        const child1 = new Plugger('child1');
        const child2 = (new Plugger('child2')).requirePlugin('child4');
        const child3 = (new Plugger('child3')).requirePlugin('child1');
        const child4 = new Plugger('child4');

        // Expected load order: child1, child3, child4, child2
        child1.pluginConfig.defaultPriority = 5;
        child2.pluginConfig.defaultPriority = 7;
        child3.pluginConfig.defaultPriority = 3;

        // Expected load order: child1, child3, child4, child2
        parent.addPlugin(child2, { priority: -1 });
        parent.addPlugin(child3);
        parent.addPlugin(child1, { priority: 0 });
        parent.addPlugin(child4);

        const expectedLoadOrder = [
          child1.getName(),
          child3.getName(),
          child4.getName(),
          child2.getName(),
        ];

        parent.sortLoadOrder();

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.getName());
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it('should throw an error when one of the required plugin(s) is not loaded', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child1 = (new Plugger('child1')).requirePlugin('child2');
        const child2 = new Plugger('child2');
        const child3 = (new Plugger('child3')).requirePlugin('child4');

        parent.addPlugin(child3);
        parent.addPlugin(child1);
        parent.addPlugin(child2);

        assert.throws(() => { parent.sortLoadOrder(); }, Plugger.errorTypes.RequirementError);
      });
    });

    describe('#initPlugin(plugin: Plugger)', () => {
      it('should initialize the plugin', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);

        parent.initPlugin(child);

        const childState = parent.getState(child);

        assert.strictEqual(childState.isInitialized, true);
        assert.strictEqual(childState.state, 'initialized');
      });

      it('should throw an error when \'plugin\' is not loaded', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        assert.throws(() => { parent.initPlugin(child); }, Plugger.errorTypes.NotLoadedError);
      });

      it('should throw an error when a required plugin(s) is not loaded', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child = new Plugger('child');
        child.requirePlugin('nonexistent');

        parent.addPlugin(child);

        assert.throws(() => { parent.initPlugin(child); }, Plugger.errorTypes.RequirementError);
      });

      it('should throw an error when a required plugin(s) is not initialized', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child1 = new Plugger('child1');

        const child2 = new Plugger('child2');
        child2.requirePlugin('child1');

        parent.addPlugin(child1).addPlugin(child2);

        assert.throws(() => { parent.initPlugin(child2); }, Plugger.errorTypes.NotInitializedError);
      });

      it('should run the callback function when an uncaught error occured when initializing', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child = new Plugger('child');

        let testResult = false;
        child.pluginCallbacks.init = () => { throw new Error(); };
        child.pluginCallbacks.error = () => { testResult = true; };

        parent.addPlugin(child);

        assert.throws(() => { parent.initPlugin(child); });
        assert.strictEqual(testResult, true);
      });
    });

    describe('#initAll()', () => {
      it('should initialize all loaded plugins with already sorted load order', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child1 = new Plugger('child1');

        const child2 = new Plugger('child2');
        child2.requirePlugin('child1');
        child2.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child1).addPlugin(child2);

        assert.doesNotThrow(() => { parent.initAll(); });

        const child1State = parent.getState(child1);
        const child2State = parent.getState(child2);

        assert.strictEqual(child1State.isInitialized, true);
        assert.strictEqual(child2State.isInitialized, true);
        assert.strictEqual(child2State.state, 'initialized');
      });

      it('should initialize all loaded plugins with unsorted load order', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        // Enable autoSort for this test

        const child1 = new Plugger('child1');

        const child2 = new Plugger('child2');
        child2.requirePlugin('child1');
        child2.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child2).addPlugin(child1);

        parent.sortLoadOrder();
        parent.initAll();

        const child1State = parent.getState(child1);
        const child2State = parent.getState(child2);

        assert.strictEqual(child1State.isInitialized, true);
        assert.strictEqual(child2State.isInitialized, true);
        assert.strictEqual(child2State.state, 'initialized');
      });
    });

    describe('#shutdownPlugin(plugin: Plugger)', () => {
      it('should shutdown the plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);

        const childState = parent.getState(child);

        assert.strictEqual(childState.isInitialized, true);
        assert.strictEqual(childState.state, 'initialized');

        let shutdownTest = false;

        child.pluginCallbacks.shutdown = () => { shutdownTest = true; };

        parent.shutdownPlugin(child);

        assert.strictEqual(shutdownTest, true);
        assert.strictEqual(childState.isInitialized, false);
        assert.strictEqual(childState.state, null);
      });

      it('should throw an error when \'plugin\' is not loaded', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');

        assert.throws(() => { parent.initPlugin(child); }, Plugger.errorTypes.NotLoadedError);
      });

      it('should throw an error when \'plugin\' is not initialized', () => {
        const parent = new Plugger('parent');

        // Disable autoInit for this test
        parent.loaderConfig.autoInit = false;

        const child = new Plugger('child');

        parent.addPlugin(child);

        assert.throws(() => {
          parent.shutdownPlugin(child);
        }, Plugger.errorTypes.NotInitializedError);
      });

      it('should run the callback function if an uncaught error occured when shutting down the plugin', () => {
        const parent = new Plugger('parent');

        const child = new Plugger('child');
        child.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child);

        const childState = parent.getState(child);

        assert.strictEqual(childState.isInitialized, true);
        assert.strictEqual(childState.state, 'initialized');

        let testResult = false;
        child.pluginCallbacks.shutdown = () => { throw new Error(); };
        child.pluginCallbacks.error = () => { testResult = true; };

        assert.throws(() => { parent.shutdownPlugin(child); });
        assert.strictEqual(testResult, true);

        // Reset the callback
        child.pluginCallbacks.shutdown = () => {};
      });
    });

    describe('#shutdownAll()', () => {
      it('should shutdown all initialized plugins', () => {
        const parent = new Plugger('parent');

        const child1 = new Plugger('child1');

        const child2 = new Plugger('child2');
        child2.requirePlugin('child1');
        child2.pluginCallbacks.init = () => 'initialized';

        parent.addPlugin(child1).addPlugin(child2);

        const child1State = parent.getState(child1);
        const child2State = parent.getState(child2);

        assert.strictEqual(child1State.isInitialized, true);
        assert.strictEqual(child2State.isInitialized, true);
        assert.strictEqual(child2State.state, 'initialized');

        parent.shutdownAll();

        const states = parent.getStates();

        for (let i = 0, len = states.length; i < len; i += 1) {
          assert.strictEqual(states[i].isInitialized, false);
          assert.strictEqual(states[i].state, null);
        }
      });
    });
  });
});
