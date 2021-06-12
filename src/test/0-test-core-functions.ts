import assert from 'assert';
import path from 'path';
import Plugger from '../index';
import test from './test-files/plugin';

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

  describe('Plugger.fromJsonFile(jsonFile?: string, props?: string[])', () => {
    it('should create an instance from \'package.json\'', () => {
      const plugin = test();

      assert.strictEqual(plugin.getName(), 'test-package-json');

      const metadata = plugin.pluginConfig.metadata as { version: string };
      assert.strictEqual(metadata.version, '1.0.0');
    });

    it('should create an instance from \'test.json\'', () => {
      const plugin = Plugger.fromJsonFile('test-files/test.json');

      assert.strictEqual(plugin.getName(), 'test-json');

      const metadata = plugin.pluginConfig.metadata as { [key: string]: any };
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should support relative paths and create an instance from \'test.json\'', () => {
      const plugin = Plugger.fromJsonFile('./test-files/test.json');

      assert.strictEqual(plugin.getName(), 'test-json');

      const metadata = plugin.pluginConfig.metadata as { [key: string]: any };
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should support absolute paths and create an instance from \'test.json\'', () => {
      const plugin = Plugger.fromJsonFile(path.resolve(__dirname, './test-files/test.json'));

      assert.strictEqual(plugin.getName(), 'test-json');

      const metadata = plugin.pluginConfig.metadata as { [key: string]: any };
      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.author, 'test');
    });

    it('should not include unspecified properties', () => {
      const plugin = Plugger.fromJsonFile('test-files/test.json', ['version']);

      assert.strictEqual(plugin.getName(), 'test-json');

      const metadata = plugin.pluginConfig.metadata as { [key: string]: any };
      assert.strictEqual(metadata.version, '1.0.0');
      assert.notStrictEqual(metadata.author, 'test');
    });
  });
});
