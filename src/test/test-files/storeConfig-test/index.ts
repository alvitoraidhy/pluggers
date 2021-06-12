/* eslint-disable no-param-reassign */
import Plugger from '../../../index';

const plugin = new Plugger('plugin');

plugin.pluginCallbacks.init = (states, config) => {
  config = config || {};
  config.TEST = 'successful';
  config.ANOTHER_TRY = 'still successful';
  config.ONE_MORE = 'success';
};

plugin.pluginCallbacks.shutdown = (state, config) => {
  config = config || {};
  config.TEST = 'another success';
  delete config.ANOTHER_TRY;
};

const loader = new Plugger('loader');

loader.setupConfig();
loader.addPlugin(plugin);

export default loader;
