/* eslint-disable max-len */
import assert from "assert";
import Plugger from "../index";

describe("Base loader functions test", () => {
  describe("Plugger(name: string)", () => {
    describe("#addPlugin(plugin: Plugger, { priority: number = defaultPriority) }", () => {
      it("should load a plugin from its instance", () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");
        assert.doesNotThrow(() => {
          parent.addPlugin(child);
        });
      });

      it("should load a plugin when its required plugin(s) is loaded", () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");

        const requiredPlugin = new Plugger("requiredPlugin");
        child.requirePlugin({ name: "requiredPlugin" });
        parent.addPlugin(requiredPlugin);

        assert.doesNotThrow(() => {
          parent.addPlugin(child);
        });
      });

      it("should load a plugin from its instance with explicit priority (priority !== defaultPriority)", () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");
        assert.doesNotThrow(() => {
          parent.addPlugin(child, { priority: 10 });
        });
      });

      it("should throw an error (ConflictError) when another plugin with the same name is already loaded", () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");
        const childSameName = new Plugger(child.metadata.name);

        parent.addPlugin(child);

        assert.throws(() => {
          parent.addPlugin(childSameName);
        }, Plugger.errorTypes.ConflictError);
      });
    });

    describe("#getPlugin(name: string)", () => {
      it("should return the requested loaded plugin", () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");
        parent.addPlugin(child);

        assert.strictEqual(parent.getPlugin("child"), child);
      });

      it("should return null when the requested plugin is not loaded", () => {
        const parent = new Plugger("parent");
        assert.strictEqual(parent.getPlugin("nonexistent"), null);
      });
    });

    describe("#getPlugins()", () => {
      it("should return all loaded plugins", () => {
        const parent = new Plugger("parent");
        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");

        parent.addPlugin(child1);
        parent.addPlugin(child2);

        const plugins = [child1, child2];

        assert.deepStrictEqual(parent.getPlugins(), plugins);
      });
    });

    describe("#removePlugin(plugin: Plugger)", () => {
      it("should unload the requested loaded plugin", () => {
        const parent = new Plugger("parent");

        const childName = "child";
        const child = new Plugger(childName);
        parent.addPlugin(child);

        assert.doesNotThrow(() => parent.removePlugin(child));
        assert.strictEqual(parent.getPlugin(childName), null);
      });

      it("should throw an error (InitializeError) when the requested plugin is initialized", () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");

        return parent
          .addPlugin(child)
          .initPlugin(child)
          .then(() => {
            assert.strictEqual(child.isInitialized(), true);
            assert.throws(() => {
              parent.removePlugin(child);
            }, Plugger.errorTypes.InitializeError);
          });
      });

      it("should throw an error (LoadError) when the requested plugin is not loaded", () => {
        const parent = new Plugger("parent");
        const notLoadedChild = new Plugger("child");

        assert.throws(() => {
          parent.removePlugin(notLoadedChild);
        }, Plugger.errorTypes.LoadError);
      });
    });

    describe("#getLoadOrder()", () => {
      it("should return the correct load order with undefined priorities", () => {
        const parent = new Plugger("parent");
        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");
        const child3 = new Plugger("child3");
        const child4 = new Plugger("child4");

        const plugins = [child3, child1, child2];

        [...plugins, child4].forEach((plugin) => {
          parent.addPlugin(plugin);
        });

        parent.removePlugin(child4);

        const expectedLoadOrder = plugins.map((x) => x.metadata.name);
        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.metadata.name);
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it("should return the correct load order with default priorities", () => {
        const parent = new Plugger("parent");
        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");
        const child3 = new Plugger("child3");
        const child4 = new Plugger("child4");

        child1.pluginConfig.defaultPriority = 10;
        child2.pluginConfig.defaultPriority = 0;
        child3.pluginConfig.defaultPriority = 7;
        child4.pluginConfig.defaultPriority = 10;

        [child1, child2, child3, child4].forEach((plugin) => {
          parent.addPlugin(plugin);
        });

        const expectedLoadOrder = [
          child2.metadata.name,
          child3.metadata.name,
          child1.metadata.name,
          child4.metadata.name,
        ];

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.metadata.name);
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it("should return the correct load order with explicit priorities", () => {
        const parent = new Plugger("parent");
        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");
        const child3 = new Plugger("child3");
        const child4 = new Plugger("child4");

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
          child1.metadata.name,
          child4.metadata.name,
          child3.metadata.name,
          child2.metadata.name,
        ];

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.metadata.name);
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it("should handle out-of-bounds negative array index value correctly", () => {
        const parent = new Plugger("parent");
        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");

        parent.addPlugin(child1);
        parent.addPlugin(child2, { priority: -10 });

        const expectedLoadOrder = [child2.metadata.name, child1.metadata.name];

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.metadata.name);
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });
    });

    describe("#sortLoadOrder()", () => {
      it("should sort the load order with undefined priorities", () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");
        const child3 = new Plugger("child3");

        child1.requirePlugin({ name: "child2" });
        child3.requirePlugin({ name: "child1" });

        parent.addPlugin(child3);
        parent.addPlugin(child1);
        parent.addPlugin(child2);

        const expectedLoadOrder = [
          child2.metadata.name,
          child1.metadata.name,
          child3.metadata.name,
        ];

        parent.sortLoadOrder();

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.metadata.name);
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it("should sort the load order with defined priorities", () => {
        const parent = new Plugger("parent");

        // Expected load order: child1, child4, child2, child3
        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");
        const child3 = new Plugger("child3");
        const child4 = new Plugger("child4");

        child2.requirePlugin({ name: "child4" });
        child3.requirePlugin({ name: "child1" });

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
          child1.metadata.name,
          child3.metadata.name,
          child4.metadata.name,
          child2.metadata.name,
        ];

        parent.sortLoadOrder();

        const loadOrder = parent.getLoadOrder().reduce((acc: string[], e) => {
          acc.push(e.metadata.name);
          return acc;
        }, []);

        assert.deepStrictEqual(loadOrder, expectedLoadOrder);
      });

      it("should throw an error when one of the required plugin(s) is not loaded", () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");
        const child3 = new Plugger("child3");

        child1.requirePlugin({ name: "child2" });
        child3.requirePlugin({ name: "child4" });

        parent.addPlugin(child3);
        parent.addPlugin(child1);
        parent.addPlugin(child2);

        assert.throws(() => {
          parent.sortLoadOrder();
        }, Plugger.errorTypes.RequirementError);
      });
    });

    describe("#hasLoaded(plugin: Plugger)", () => {
      it("should return true if the plugin is loaded by the loader", () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");

        parent.addPlugin(child);

        assert.strictEqual(parent.hasLoaded(child), true);
      });

      it("should return false if the plugin is not loaded by the loader", () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");

        assert.strictEqual(parent.hasLoaded(child), false);
      });
    });
  });
});
