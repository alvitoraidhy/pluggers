import assert from "assert";
import path from "path";
import Plugger from "../src/index";
import syncTest from "./test-files/syncPlugin";
import asyncTest from "./test-files/asyncPlugin";

describe("Core functions test", () => {
  describe("Plugger(name: string)", () => {
    it("should create an instance without a problem", () => {
      const name = "plugin";

      assert.doesNotThrow(() => {
        new Plugger(name);
      });
    });

    describe("#getName()", () => {
      it("should return the instance's name", () => {
        const name = "very cool name";

        const instance = new Plugger(name);

        assert.strictEqual(instance.getName(), name);
      });
    });
  });
});

describe("Synchronous core functions test", () => {
  describe("Plugger.fromJsonFileSync(jsonFile?: string, props?: string[])", () => {
    it("should create an instance from 'package.json'", () => {
      const plugin = syncTest();

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-package-json");
      assert.strictEqual(metadata.version, "1.0.0");
    });

    it("should create an instance from 'package.json' using a directory path", () => {
      const plugin = Plugger.fromJsonFileSync(
        path.join(__dirname, "test-files")
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-package-json");
      assert.strictEqual(metadata.version, "1.0.0");
    });

    it("should create an instance from 'test.json'", () => {
      const plugin = Plugger.fromJsonFileSync(
        path.join(__dirname, "test-files/test.json")
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.strictEqual(metadata.author, "test");
    });

    it("should support relative paths and create an instance from 'test.json'", () => {
      const currentCwd = process.cwd();
      process.chdir(__dirname);
      const plugin = Plugger.fromJsonFileSync("./test-files/test.json");
      process.chdir(currentCwd);

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.strictEqual(metadata.author, "test");
    });

    it("should support absolute paths and create an instance from 'test.json'", () => {
      const plugin = Plugger.fromJsonFileSync(
        path.resolve(__dirname, "./test-files/test.json")
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.strictEqual(metadata.author, "test");
    });

    it("should not include unspecified properties", () => {
      const plugin = Plugger.fromJsonFileSync(
        path.resolve(__dirname, "./test-files/test.json"),
        ["version"]
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.notStrictEqual(metadata.author, "test");
    });
  });
});

describe("Asynchronous core functions test", () => {
  describe("Plugger.fromJsonFile(jsonFile?: string, props?: string[])", () => {
    it("should create an instance from 'package.json'", async () => {
      const plugin = await asyncTest();

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-package-json");
      assert.strictEqual(metadata.version, "1.0.0");
    });

    it("should create an instance from 'package.json' using a directory path", async () => {
      const plugin = await Plugger.fromJsonFile(
        path.join(__dirname, "test-files")
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-package-json");
      assert.strictEqual(metadata.version, "1.0.0");
    });

    it("should create an instance from 'test.json'", async () => {
      const plugin = await Plugger.fromJsonFile(
        path.join(__dirname, "test-files/test.json")
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.strictEqual(metadata.author, "test");
    });

    it("should support relative paths and create an instance from 'test.json'", async () => {
      const currentCwd = process.cwd();
      process.chdir(__dirname);
      const plugin = await Plugger.fromJsonFile("./test-files/test.json");
      process.chdir(currentCwd);

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.strictEqual(metadata.author, "test");
    });

    it("should support absolute paths and create an instance from 'test.json'", async () => {
      const plugin = await Plugger.fromJsonFile(
        path.resolve(__dirname, "./test-files/test.json")
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.strictEqual(metadata.author, "test");
    });

    it("should not include unspecified properties", async () => {
      const plugin = await Plugger.fromJsonFile(
        path.resolve(__dirname, "./test-files/test.json"),
        ["version"]
      );

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, "test-json");
      assert.strictEqual(metadata.version, "1.0.0");
      assert.notStrictEqual(metadata.author, "test");
    });
  });
});
