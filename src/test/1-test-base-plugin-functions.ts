import assert from "assert";
import Plugger from "../index";

describe("Base plugin functions test", () => {
  describe("Plugger(name: string)", () => {
    describe("#getContext()", () => {
      it("should be persistent during runtime", () => {
        const plugin = new Plugger("plugin");
        const ctx = plugin.getContext();

        const someProperty = "someValue";
        ctx.someProperty = someProperty;
        assert.strictEqual(ctx.someProperty, someProperty);

        const ctx2 = plugin.getContext();
        assert.strictEqual(ctx2, ctx);
        assert.deepStrictEqual(ctx2, ctx);
        assert.strictEqual(ctx2.someProperty, someProperty);
      });

      it("should be different between plugins", () => {
        const plugin1 = new Plugger("plugin1");
        const plugin2 = new Plugger("plugin2");

        assert.notStrictEqual(plugin1.getContext(), plugin2.getContext());
      });
    });

    describe("#requirePlugin(metadata: { name: string, [key: string]: unknown })", () => {
      it("should add the plugin as a requirement without metadata", () => {
        const parent = new Plugger("parent");
        assert.doesNotThrow(() => {
          parent.requirePlugin({ name: "required" });
        });
      });

      it("should add the plugin as a requirement with metadata", () => {
        const parent = new Plugger("parent");
        assert.doesNotThrow(() => {
          parent.requirePlugin({ name: "required", version: "1.0.0" });
        });
      });

      it("should throw an error (ConflictError) when the plugin is already required", () => {
        const parent = new Plugger("parent");

        const requiredPluginMetadata = { name: "required" };
        parent.requirePlugin(requiredPluginMetadata);

        assert.throws(() => {
          parent.requirePlugin(requiredPluginMetadata);
        }, Plugger.errorTypes.ConflictError);
      });
    });

    describe("#removeRequiredPlugin(name: string)", () => {
      it("should remove the plugin from requirement", () => {
        const parent = new Plugger("parent");

        const requiredPluginName = "required";
        parent.requirePlugin({ name: requiredPluginName });

        assert.doesNotThrow(() => {
          parent.removeRequiredPlugin(requiredPluginName);
        });
      });

      it("should throw an error (RequirementError) when the plugin is not required", () => {
        const parent = new Plugger("parent");

        assert.throws(() => {
          parent.removeRequiredPlugin("notRequired");
        }, Plugger.errorTypes.RequirementError);
      });
    });

    describe("#getRequiredPlugins()", () => {
      it("should return the appropriate default value", () => {
        const plugin = new Plugger("plugin");
        const requiredPlugins = plugin.getRequiredPlugins();
        assert.deepStrictEqual(requiredPlugins, []);
      });

      it("should return the correct required plugins when a plugin(s) is added as a requirement", () => {
        const plugin = new Plugger("plugin");
        const pluginRequirements: string[] = [
          "plugin1",
          "plugin2",
          "plugin3",
          "plugin7",
        ];

        pluginRequirements.forEach((x) => plugin.requirePlugin({ name: x }));
        const requiredPlugins = plugin.getRequiredPlugins().map((x) => x.name);

        assert.deepStrictEqual(requiredPlugins, pluginRequirements);
      });

      it("should return the correct required plugins when a plugin(s) is added and removed as a requirement", () => {
        const plugin = new Plugger("plugin");
        const optionalPlugins: string[] = ["plugin1", "plugin3"];

        const pluginRequirements: string[] = ["plugin2", "plugin7"];

        const combinedArr = [...optionalPlugins, ...pluginRequirements];

        // Add both optional and required plugins
        combinedArr.forEach((requiredPlugin) => {
          plugin.requirePlugin({ name: requiredPlugin });
          const requiredPlugins = plugin.getRequiredPlugins();
          assert.strictEqual(
            requiredPlugins.some((x) => x.name === requiredPlugin),
            true
          );
        });

        // Remove optional plugins from requirement
        optionalPlugins.forEach((optionalPlugin) => {
          plugin.removeRequiredPlugin(optionalPlugin);
          const requiredPlugins = plugin.getRequiredPlugins();
          assert.strictEqual(
            requiredPlugins.some((x) => x.name === optionalPlugin),
            false
          );
        });
      });
    });

    describe("#requires(metadata: { name: string, [key: string]: unknown })", () => {
      it("should return true when a plugin with the exact metadata is found as a requirement", () => {
        const parent = new Plugger("parent");

        const metadata = { name: "required", version: "1.0.0" };
        parent.requirePlugin(metadata);

        assert.strictEqual(parent.requires(metadata), true);
      });

      it("should return false when a plugin with the exact metadata is not found as a requirement", () => {
        const parent = new Plugger("parent");

        const metadata = { name: "required", version: "1.0.0" };
        const anotherMetadata = { name: "required", version: "2.0.0" };
        parent.requirePlugin(metadata);

        assert.strictEqual(parent.requires(anotherMetadata), false);
      });

      it("should return false when the plugin doesn't have any requirements", () => {
        const parent = new Plugger("parent");

        const metadata = { name: "required", version: "1.0.0" };

        assert.strictEqual(parent.requires(metadata), false);
      });
    });

    describe("#getState()", () => {
      it("should return null if the plugin is uninitiated", () => {
        const plugin = new Plugger("plugin");

        assert.strictEqual(plugin.getState(), null);
      });
    });

    describe("#getStatus()", () => {
      it("should return 'ready' if the plugin is uninitiated", () => {
        const plugin = new Plugger("plugin");

        assert.strictEqual(plugin.getStatus(), "ready");
      });
    });

    describe("#isInitialized()", () => {
      it("should return false if the plugin is uninitiated", () => {
        const plugin = new Plugger("plugin");

        assert.strictEqual(plugin.isInitialized(), false);
      });
    });
  });
});
