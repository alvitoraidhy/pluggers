import assert from 'assert';
import path from 'path';
import Plugger, { AsyncPlugger } from '../index';
import syncTest from './test-files/syncPlugin';
import asyncTest from './test-files/asyncPlugin';

describe('Core functions test', () => {
  describe('Plugger(name: string)', () => {
    it('should create an instance without a problem', () => {
      const name = 'plugin';

      assert.doesNotThrow(() => {
        // eslint-disable-next-line no-unused-vars
        const plugin = new Plugger(name);
      });
    });
  });
});

describe('Synchronous core functions test', () => {
  describe('Plugger.fromJsonFile(jsonFile?: string, props?: string[])', () => {
    it('should create an instance from \'package.json\'', () => {
      const plugin = syncTest();

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-package-json');
      assert.strictEqual(metadata.version, '1.0.0');
    });

    it('should create an instance from \'test.json\'', () => {
      const plugin = Plugger.fromJsonFile(path.join(__dirname, 'test-files/test.json'));

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should support relative paths and create an instance from \'test.json\'', () => {
      const currentCwd = process.cwd();
      process.chdir(__dirname);
      const plugin = Plugger.fromJsonFile('./test-files/test.json');
      process.chdir(currentCwd);

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should support absolute paths and create an instance from \'test.json\'', () => {
      const plugin = Plugger.fromJsonFile(path.resolve(__dirname, './test-files/test.json'));

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should not include unspecified properties', () => {
      const plugin = Plugger.fromJsonFile(path.resolve(__dirname, './test-files/test.json'), ['version']);

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.notStrictEqual(metadata.author, 'test');
    });
  });
});

describe('Asynchronous core functions test', () => {
  describe('AsyncPlugger.fromJsonFile(jsonFile?: string, props?: string[])', () => {
    it('should create an instance from \'package.json\'', async () => {
      const plugin = await asyncTest();

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-package-json');
      assert.strictEqual(metadata.version, '1.0.0');
    });

    it('should create an instance from \'test.json\'', async () => {
      const plugin = await AsyncPlugger.fromJsonFile(path.join(__dirname, 'test-files/test.json'));

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should support relative paths and create an instance from \'test.json\'', async () => {
      const currentCwd = process.cwd();
      process.chdir(__dirname);
      const plugin = await AsyncPlugger.fromJsonFile('./test-files/test.json');
      process.chdir(currentCwd);

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should support absolute paths and create an instance from \'test.json\'', async () => {
      const plugin = await AsyncPlugger.fromJsonFile(path.resolve(__dirname, './test-files/test.json'));

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should not include unspecified properties', async () => {
      const plugin = await AsyncPlugger.fromJsonFile(path.resolve(__dirname, './test-files/test.json'), ['version']);

      const { metadata } = plugin;
      assert.strictEqual(metadata.name, 'test-json');
      assert.strictEqual(metadata.version, '1.0.0');
      assert.notStrictEqual(metadata.author, 'test');
    });
  });
});
