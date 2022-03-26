/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-len */
import assert from "assert";
import Plugger from "../src/index";
import { listenerProps } from "../src/constants";

describe("Loader functions test", () => {
  describe("Plugger(name: string)", () => {
    describe("#initPlugin(plugin: Plugger)", () => {
      it("should initialize the plugin", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");
        child.pluginCallbacks.init = () => "initialized";

        parent.addPlugin(child);

        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), "initialized");
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), "initialized");
      });

      it("should initialize the plugin with a required plugin", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");

        const child2 = new Plugger("child2");
        child2.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child).addPlugin(child2);
        await parent.initPlugin(child);
        await parent.initPlugin(child2);

        assert.strictEqual(child2.getStatus(), "initialized");
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), "initialized");
      });

      it("should initialize the plugin with a required plugin and its metadata", async () => {
        const parent = new Plugger("parent");

        const requiredMetadata = {
          name: "child",
          version: "^1.0.0",
          contributors: {
            functions: "john doe",
            designs: "jane doe",
          },
        };

        const loadedMetadata = {
          name: "child",
          version: "1.5.0",
          contributors: {
            functions: "john doe",
            designs: "jane doe",
          },
        };

        const child = new Plugger();
        child.metadata = { ...loadedMetadata };

        const child2 = new Plugger("child2");
        child2.requirePlugin(requiredMetadata);
        child2.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child).addPlugin(child2);
        await parent.initPlugin(child);
        await parent.initPlugin(child2);

        assert.strictEqual(child2.getStatus(), "initialized");
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), "initialized");
      });

      it("should throw an error when 'plugin' is not loaded", () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");

        assert.throws(() => {
          parent.initPlugin(child);
        }, Plugger.errorTypes.LoadError);
      });

      it("should throw an error when 'plugin' is already initialized", async () => {
        const parent = new Plugger("parent");
        const child = new Plugger("child");

        parent.addPlugin(child);
        await parent.initPlugin(child);

        await assert.rejects(
          () => parent.initPlugin(child),
          Plugger.errorTypes.InitializeError
        );
      });

      it("should throw an error when a required plugin(s) is not loaded", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");
        child.requirePlugin({ name: "nonexistent" });

        parent.addPlugin(child);

        await assert.rejects(
          () => parent.initPlugin(child),
          Plugger.errorTypes.RequirementError
        );
      });

      it("should throw an error when a required plugin(s) does not match with the metadata of the loaded plugin", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger();
        child.metadata = {
          name: "child",
          version: "1.0.0",
        };

        const child2 = new Plugger("child2");
        child2.requirePlugin({ name: "child", version: "1.0.1" });

        parent.addPlugin(child).addPlugin(child2);

        await assert.rejects(
          () => parent.initPlugin(child2),
          Plugger.errorTypes.RequirementError
        );
      });

      it("should throw an error when a required plugin(s) is not initialized", async () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");

        const child2 = new Plugger("child2");
        child2.requirePlugin({ name: "child1" });

        parent.addPlugin(child1).addPlugin(child2);

        await assert.rejects(
          () => parent.initPlugin(child2),
          Plugger.errorTypes.RequirementError
        );
      });

      it("should run the default callback function if an uncaught error occured when initializing", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");
        child.pluginCallbacks.init = async () => {
          throw new Error();
        };

        parent.addPlugin(child);

        await assert.rejects(() => parent.initPlugin(child));
      });

      it("should run the callback function if an uncaught error occured when initializing", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");

        let testResult = false;
        child.pluginCallbacks.init = async () => {
          throw new Error();
        };
        child.pluginCallbacks.error = async (event, error) => {
          assert.strictEqual(event, "init");
          testResult = true;
          return error;
        };

        parent.addPlugin(child);

        await assert.rejects(() => parent.initPlugin(child));
        assert.strictEqual(testResult, true);
      });

      it("should be able to ignore if an uncaught error occured when initializing", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");

        let testResult = false;
        child.pluginCallbacks.init = async () => {
          throw new Error();
        };
        child.pluginCallbacks.error = async (event) => {
          assert.strictEqual(event, "init");
          testResult = true;
          return null;
        };

        parent.addPlugin(child);

        await assert.doesNotReject(() => parent.initPlugin(child));
        assert.strictEqual(testResult, true);
      });
    });

    describe("#initAll()", () => {
      it("should initialize all loaded plugins", async () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");

        const child2 = new Plugger("child2");
        child2.requirePlugin({ name: "child1" });
        child2.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child1).addPlugin(child2);

        await assert.doesNotReject(() => parent.initAll());

        assert.strictEqual(child1.getStatus(), "initialized");
        assert.strictEqual(child1.isInitialized(), true);

        assert.strictEqual(child2.getStatus(), "initialized");
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(child2.getState(), "initialized");
      });

      it("should not initialize a plugin twice", async () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");

        const testResult = [];
        child2.pluginCallbacks.init = async () => {
          testResult.push("initialized");
        };

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initPlugin(child2);

        await assert.doesNotReject(() => parent.initAll());

        assert.strictEqual(child1.getStatus(), "initialized");
        assert.strictEqual(child1.isInitialized(), true);

        assert.strictEqual(child2.getStatus(), "initialized");
        assert.strictEqual(child2.isInitialized(), true);
        assert.strictEqual(testResult.length, 1);
      });
    });

    describe("#shutdownPlugin(plugin: Plugger)", () => {
      it("should shutdown the plugin", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");
        child.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), "initialized");
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), "initialized");

        let shutdownTest = false;

        child.pluginCallbacks.shutdown = async () => {
          shutdownTest = true;
        };

        await parent.shutdownPlugin(child);

        assert.strictEqual(shutdownTest, true);
        assert.notStrictEqual(child.getStatus(), "initialized");
        assert.strictEqual(child.isInitialized(), false);
      });

      it("should throw an error when 'plugin' is not loaded", () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");

        assert.throws(() => {
          parent.shutdownPlugin(child);
        }, Plugger.errorTypes.LoadError);
      });

      it("should throw an error when 'plugin' is required by at least one initialized plugin", async () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");

        const child2 = new Plugger("child2");
        child2.requirePlugin({ name: "child1" });

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initAll();

        await assert.rejects(
          () => parent.shutdownPlugin(child1),
          Plugger.errorTypes.RequirementError
        );
      });

      it("should throw an error when 'plugin' is not initialized", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");

        parent.addPlugin(child);

        await assert.rejects(
          () => parent.shutdownPlugin(child),
          Plugger.errorTypes.InitializeError
        );
      });

      it("should run the default callback function if an uncaught error occured when shutting down the plugin", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");
        child.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), "initialized");
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), "initialized");

        child.pluginCallbacks.shutdown = async () => {
          throw new Error();
        };

        await assert.rejects(() => parent.shutdownPlugin(child));
      });

      it("should run the callback function if an uncaught error occured when shutting down the plugin", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");
        child.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), "initialized");
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), "initialized");

        let testResult = false;
        child.pluginCallbacks.shutdown = async () => {
          throw new Error();
        };
        child.pluginCallbacks.error = async (event, error) => {
          assert.strictEqual(event, "shutdown");
          testResult = true;
          return error;
        };

        await assert.rejects(() => parent.shutdownPlugin(child));
        assert.strictEqual(testResult, true);
      });

      it("should be able to ignore if an uncaught error occured when shutting down the plugin", async () => {
        const parent = new Plugger("parent");

        const child = new Plugger("child");
        child.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child);
        await parent.initPlugin(child);

        assert.strictEqual(child.getStatus(), "initialized");
        assert.strictEqual(child.isInitialized(), true);
        assert.strictEqual(child.getState(), "initialized");

        let testResult = false;
        child.pluginCallbacks.shutdown = async () => {
          throw new Error();
        };
        child.pluginCallbacks.error = async (event) => {
          assert.strictEqual(event, "shutdown");
          testResult = true;
          return null;
        };

        await assert.doesNotReject(() => parent.shutdownPlugin(child));
        assert.strictEqual(testResult, true);
      });
    });

    describe("#shutdownAll()", () => {
      it("should shutdown all initialized plugins", async () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");

        child2.requirePlugin({ name: "child1" });
        child2.pluginCallbacks.init = async () => "initialized";

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initPlugin(child1);
        await parent.initPlugin(child2);

        [child1, child2].forEach((plugin) => {
          assert.strictEqual(plugin.getStatus(), "initialized");
          assert.strictEqual(plugin.isInitialized(), true);
        });

        assert.strictEqual(child2.getState(), "initialized");

        await parent.shutdownAll();

        [child1, child2].forEach((plugin) => {
          assert.notStrictEqual(plugin.getStatus(), "initialized");
          assert.strictEqual(plugin.isInitialized(), false);
          assert.strictEqual(plugin.getState(), null);
        });
      });

      it("should not shutdown uninitialized plugins", async () => {
        const parent = new Plugger("parent");

        const child1 = new Plugger("child1");
        const child2 = new Plugger("child2");

        let testResult = true;
        /* istanbul ignore next */
        child2.pluginCallbacks.shutdown = async () => {
          testResult = false;
        };

        parent.addPlugin(child1).addPlugin(child2);
        await parent.initPlugin(child1);

        assert.notStrictEqual(child2.getStatus(), "initialized");
        assert.strictEqual(child2.isInitialized(), false);

        await assert.doesNotReject(() => parent.shutdownAll());
        assert.strictEqual(testResult, true);
      });
    });

    describe("#attachExitListener()", () => {
      it("should attach an exit event", () => {
        const plugin = new Plugger("plugin");
        plugin.attachExitListener();

        const exitEvents = ["exit", "SIGINT", "SIGTERM", "SIGQUIT"];

        exitEvents.forEach((event) => {
          assert.strictEqual(
            process
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .listeners(event)
              .includes(plugin[listenerProps].exitListener!),
            true
          );
        });
      });

      it("should do nothing if there is already a listener", () => {
        const plugin = new Plugger("plugin");

        plugin.attachExitListener();

        assert.doesNotThrow(() => {
          plugin.attachExitListener();
        });

        const exitEvents = ["exit", "SIGINT", "SIGTERM", "SIGQUIT"];

        exitEvents.forEach((event) => {
          assert.strictEqual(
            process
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .listeners(event)
              .filter((e) => e === plugin[listenerProps].exitListener!).length,
            1
          );
        });
      });
    });

    describe("#detachExitListener()", () => {
      it("should detach an exit event", () => {
        const plugin = new Plugger("plugin");
        plugin.attachExitListener();

        const exitEvents = ["exit", "SIGINT", "SIGTERM", "SIGQUIT"];

        exitEvents.forEach((event) => {
          assert.strictEqual(
            process
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .listeners(event)
              .includes(plugin[listenerProps].exitListener!),
            true
          );
        });

        plugin.detachExitListener();
        exitEvents.forEach((event) => {
          assert.strictEqual(
            process
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .listeners(event)
              .includes(plugin[listenerProps].exitListener!),
            false
          );
        });
      });

      it("should do nothing if there is no listener", () => {
        const plugin = new Plugger("plugin");
        assert.doesNotThrow(() => {
          plugin.detachExitListener();
        });
      });
    });
  });
});
