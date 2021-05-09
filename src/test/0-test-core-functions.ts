import assert from 'assert';
import Plugger from '../index';

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
