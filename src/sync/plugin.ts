import {
  pluginProps,
} from '../constants';

import LoaderBase from '../base/loader';

export default class Plugin extends LoaderBase<Plugin> {
  selfInit(pluginsStates?: Parameters<this['pluginCallbacks']['init']>[0]): this {
    try {
      this[pluginProps].status = 'busy';
      this[pluginProps].state = this.pluginCallbacks.init(pluginsStates);
      this[pluginProps].status = 'initialized';
    } catch (err) {
      const result = this.pluginCallbacks.error('init', err);
      this[pluginProps].status = result ? 'crashed' : 'ready';
      if (result !== null) throw result;
    }

    return this;
  }

  selfShutdown(): this {
    const { state } = this[pluginProps];
    try {
      this[pluginProps].status = 'busy';
      this.pluginCallbacks.shutdown(state);
      this[pluginProps].state = null;
      this[pluginProps].status = 'ready';
    } catch (err) {
      const result = this.pluginCallbacks.error('shutdown', err);
      this[pluginProps].status = result ? 'crashed' : 'ready';
      if (result !== null) throw result;
    }

    return this;
  }
}
