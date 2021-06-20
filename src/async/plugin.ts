import { Mutex } from 'async-mutex';

import {
  pluginProps, asyncProps,
} from '../constants';

import LoaderBase from '../base/loader';

export default class AsyncPlugin extends LoaderBase<AsyncPlugin> {
  private [asyncProps] = {
    mutex: new Mutex(),
  };

  async selfInit(pluginsStates?: Parameters<this['pluginCallbacks']['init']>[0]): Promise<this> {
    try {
      this[pluginProps].status = 'busy';
      this[pluginProps].state = await this.pluginCallbacks.init(pluginsStates);
      this[pluginProps].status = 'initialized';
    } catch (err) {
      const result = await this.pluginCallbacks.error('init', err);
      this[pluginProps].status = result ? 'crashed' : 'ready';
      if (result !== null) throw result;
    }

    return this;
  }

  async selfShutdown(): Promise<this> {
    const { state } = this[pluginProps];
    try {
      this[pluginProps].status = 'busy';
      await this.pluginCallbacks.shutdown(state);
      this[pluginProps].state = null;
      this[pluginProps].status = 'ready';
    } catch (err) {
      const result = await this.pluginCallbacks.error('shutdown', err);
      this[pluginProps].status = result ? 'crashed' : 'ready';
      if (result !== null) throw result;
    }

    return this;
  }

  isInitialized(): boolean {
    return this.getStatus() === 'initialized';
  }

  createSession(func: () => Promise<unknown> | unknown) {
    return this[asyncProps].mutex.runExclusive(func);
  }
}
