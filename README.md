# Pluggers

[![npm](https://img.shields.io/npm/v/pluggers.svg)](https://www.npmjs.com/package/pluggers)
[![CircleCI](https://circleci.com/gh/alvitoraidhy/pluggers.svg?style=shield)](https://circleci.com/gh/alvitoraidhy/pluggers)
[![Codecov](https://codecov.io/gh/alvitoraidhy/pluggers/branch/master/graph/badge.svg?token=MZY3IEV0HS)](https://codecov.io/gh/alvitoraidhy/pluggers)

*A convenient plugin manager library.*

[pluggers](https://www.npmjs.com/package/pluggers) is designed to make modular projects easier to create. [recursive-install](https://www.npmjs.com/package/recursive-install) is recommended for making plugins truly independent.

**Warning**: there are many breaking changes for those who are upgrading from pre-v1 to v1.

## Features & Plans

- [X] **Synchronous** or **Asynchronous** plugin loading
- [x] **Flexible access** between plugins
- [x] **Priority-based** load order (explicit or automatic)

## Installation

Use the package manager **npm** to install pluggers.

```bash
npm install --save pluggers
```

## Usage

`./plugin1.js`

```javascript
// ./plugin1.js
const Plugger = require('pluggers').default;

const plugin = new Plugger('plugin1');

plugin.pluginCallbacks.init = () => {
  const test = "Hello World!";
  return test
};

module.exports = plugin;
```

`./plugin2.js`

```javascript
// ./plugin2.js
const Plugger = require('pluggers').default;

// Error will be thrown if the plugin is using a used name ("plugin1") when loaded
const plugin = new Plugger('plugin2');

// Error will be thrown if a plugin named "plugin1" is not loaded
plugin.requirePlugin('plugin1');

plugin.pluginCallbacks.init = (plugins) => {
  const { plugin1 } = plugins
  console.log(plugin1);
};

module.exports = plugin;
```

`./master.js`

```javascript
// ./master.js
const Plugger = require('pluggers').default;

// Create instance
const master = new Plugger('master');

// Add plugins
master.addPlugin(require('./plugin1'));
master.addPlugin(require('./plugin2'));

master.initAll().then(() => {
  console.log('Complete!')
});
```

The above codes will print "Hello World!" and then "Complete!" if `master.js` is executed.

## API

Some common terms:

- **Plugger**: the main class that can act as both a plugin and a loader.
- **Plugin**: a Plugger instance that acts as a plugin.
- **Loader**: a Plugger instance that acts as a loader.
- **Loaded plugin**: a plugin that has been added/loaded to a loader by using the `addPlugin()` function.
- **Initialized plugin**: a plugin that has been initialized by a loader by using the `initPlugin()` function.

### Creating an instance

#### `Plugger(name?: string)`

`name` is the name of the instance. Don't forget to use `new`, since `Plugger` is a class.

```javascript
const Plugger = require('./pluggers').default;

const instance = new Plugger('master');
```

##### Returns

A new Plugger instance.

##### Throws

\-

#### `Plugger.fromJsonFile(fileName?: string, props?: string[])`

Creates a Plugger instance from a JSON file. `filename` is the file name of the JSON, relative to `process.cwd()`, defaults to `'package.json'`. `props` is an optional argument that specifies which properties to be included as the metadata of the instance. JSON must include `'name'` for the instance's name. Everything will be stored to `instance.metadata`.

`./package.json`

```javascript
{
  "name": "myPlugin",
  "version": "1.0.0"
}
```

`./index.js`

```javascript
...
const plugin = await Plugger.fromJsonFile();

// 'myPlugin'
console.log(plugin.getName());

// '{"name": "myPlugin", "version":"1.0.0"}'
console.log(JSON.stringify(plugin.metadata));
```

##### Returns

A promise that resolves to a new Plugger instance (`Promise<Plugger>`).

##### Throws

If `fileName` does not exist (`Error`)

#### `Plugger.fromJsonFileSync(fileName?: string, props?: string[])`

Synchronous counterpart of `Plugger.fromJsonFile()`.

`./package.json`

```javascript
{
  "name": "myPlugin",
  "version": "1.0.0"
}
```

`./index.js`

```javascript
...
const plugin = Plugger.fromJsonFileSync();

// 'myPlugin'
console.log(plugin.getName());

// '{"name": "myPlugin", "version":"1.0.0"}'
console.log(String(plugin.metadata));
```

##### Returns

A new Plugger instance (`Plugger`).

##### Throws

If `fileName` does not exist (`Error`)

### As a plugin

#### `instance.metadata`

**Type**: `Object`\
**Default**: `{}`\
The metadata of `instance`.

#### `instance.pluginConfig.defaultPriority`

**Type**: `number`\
**Default**: `undefinedPriority` (private constant)\
The default priority of `instance`. This property can be used when a plugin is designed to always be loaded at a specific step of an app (ex: designed to be loaded first as a core plugin or loaded last as the app runner).

#### `instance.pluginCallbacks.init`

**Type**: `(pluginsStates: { [index: string]: any }, config: object | null) => any`\
**Default**: `() => {}`\
Callback to be run when `instance` is initializing. `pluginsStates` is an `Object` that contains the state(s) of the instance's required plugin(s) with their names as their respective keys. `config` is either an `Object` which contains the configurations imported from `'*.env'` file if `setupConfig()` was run by the loader, or `null` if otherwise. `config` is mutable and all changes will be saved to the `'*.env'` file that was passed to `setupConfig()`. The return value of the callback will be stored by the loader as the 'state' of the plugin. This state will be passed to any other plugins that has the plugin's name as a requirement.

#### `instance.pluginCallbacks.error`

**Type**: `(event: string, error: Error) => Error | null`\
**Default**: `() => {}`\
Callback to be run when `instance` encounters an uncaught error when running any of the other callbacks. `event` is the event type of the callback that throws the error. `error` is the error instance. `error` callbacks should either return an `Error` instance that will be thrown by the loader, or `null` to ignore the error entirely and let the whole program continue.

#### `instance.pluginCallbacks.shutdown`

**Type**: `(state: any, config: object | null) => any) => void`\
**Default**: `() => {}`\
Callback to be run when `instance` is shutting down. `state` is the state of the plugin that is shutting down. `config` is an `Object` that is mutable and periodically saved to a configuration file if `setupConfig()` was run by the loader, or `null` if otherwise.

#### `instance.getName()`

Returns the name of `instance`.

##### Returns

The name of `instance` (`string`)

##### Throws

\-

#### `instance.getContext()`

Returns the context of `instance`. This context is exclusive to the instance only and directly mutable. Note that the context is not the state of the instance. It is designed to be used internally by the instance.

##### Returns

The context of `instance` (`Object`)

##### Throws

\-

#### `instance.requirePlugin(pluginName: string, metadata?: object)`

Adds `pluginName`, with an optional `metadata` object, as a requirement when a loader tries to load `instance`. A loader will check if a plugin with the name `pluginName` (and with the metadata that 100% matches `metadata`, if provided) is loaded and initialized first before trying to initialize the instance. The property `'version'` of `metadata` and its nested objects supports [semantic versioning syntax](https://docs.npmjs.com/about-semantic-versioning).

##### Returns

`instance` (`Plugger`)

##### Throws

If `pluginName` is already a requirement of the instance (`Plugger.errorTypes.ConflictError`)

#### `instance.removeRequiredPlugin(pluginName:string)`

Removes `pluginName` from `instance`'s list of required plugins.

##### Returns

`instance` (`Plugger`)

##### Throws

If `pluginName` is not a requirement for `instance` (`Plugger.errorTypes.RequirementError`)

#### `instance.getRequiredPlugins()`

Returns `instance`'s list of required plugins and their metadatas.

##### Returns

An array of `instance`'s required plugins' names and metadatas (`{ name: string, ...metadata}[]`)

##### Throws

\-

#### `instance.requires(metadata: object)`

Checks whether `instance` requires a plugin with the metadata `metadata` or not.

##### Returns

`true` if `instance` requires a plugin with the metadata `metadata`, `false` if not (`boolean`)

##### Throws

\-

### As a loader

#### `instance.addPlugin(plugin: Plugger, { priority?: number })`

Loads `plugin` to `instance`. `plugin` is a plugin that you want to load. `priority` is the load order priority of `plugin`, which is optional. If `priority` is not provied, then the priority will default to `plugin.pluginConfig.defaultPriority`.

##### Returns

`instance` (`Plugger`)

##### Throws

If a plugin with the same name is already loaded (`Plugger.errorTypes.ConflictError`)

#### `instance.addFolder(dirName: string)`

Loads all packages in `dirName` that directly export a Plugger instance. `dirName` is relative to `process.cwd()`. Any other packages that don't export a Plugger instance will be silently ignored.

##### Returns

A promise that resolves to `instance` (`Promise<Plugger>`)

##### Throws

- If `dirName` directory does not exist (`Error`)
- The same as `addPlugin()`

#### `instance.addFolderSync(dirName: string)`

Synchronous counterpart of `instance.addFolder()`.

##### Returns

`instance` (`Plugger`)

##### Throws

- If `dirName` directory does not exist (`Error`)
- The same as `addPlugin()`

#### `instance.removePlugin(plugin: Plugger)`

`plugin` is a plugin that you want to unload from `instance`.

##### Returns

`instance` (`Plugger`)

##### Throws

- If `plugin` isn't loaded (`Plugger.errorTypes.LoadError`)
- If `plugin` is required by at least one initialized plugin by the time of the execution (`Plugger.errorTypes.RequirementError`)

#### `instance.getPlugin(pluginName: string)`

`pluginName` is the name of the loaded plugin that you want to retrieve.

##### Returns

- A Plugger instance with the same name as `pluginName` (`Plugger`), or
- `null` if not found

##### Throws

\-

#### `instance.getPlugins()`

Gets all loaded plugins.

##### Returns

An array of Plugger instances (`Plugger[]`)

##### Throws

\-

#### `instance.initPlugin(plugin: Plugger)`

Initializes `plugin`.

##### Returns

`instance` (`Plugger`)

##### Throws

- If `plugin` is not loaded (`Plugger.errorTypes.LoadError`)
- If `plugin` is already initialized (`Plugger.errorTypes.InitializeError`)
- If at least one of the required plugin(s) is not loaded (`Plugger.errorTypes.RequirementError`)
- If at least one of the required plugin(s)'s metadata is different than the loaded plugin (`Plugger.errorTypes.RequirementError`)
- If at least one of the required plugin(s) is not initialized (`Plugger.errorTypes.RequirementError`)

#### `instance.initAll()`

Initializes all loaded plugins.

##### Returns

`instance` (`Plugger`)

##### Throws

The same as `initPlugin()`

#### `instance.shutdownPlugin(plugin: Plugger)`

Shuts down `plugin` and resets its state.

##### Return

`instance` (`Plugger`)

##### Throws

- If `plugin` is not loaded (`Plugger.errorTypes.LoadError`)
- If `plugin` is not initialized (`Plugger.errorTypes.InitializeError`)
- If at least one initialized plugin requires `plugin` (`Plugger.errorTypes.RequirementError`)

#### `instance.shutdownAll()`

Shuts down all initialized plugins and resets their states

##### Returns

`instance` (`Plugger`)

##### Throws

The same as `shutdownPlugin()`

#### `instance.getState(plugin: Plugger)`

Gets the state of `plugin`.

##### Returns

- `PluginState`, which is as the following:

  ```javascript
  {
    instance: Plugger,
    isInitialized: boolean,
    state: any,
    priority: number,
    requires: PluginState[]
  }
  ```

- `null` if `plugin` is not loaded

##### Throws

\-

#### `instance.getStates()`

Gets the states of all loaded plugins.

##### Returns

An array of loaded plugins' states (`PluginState[]`)

##### Throws

\-

#### `instance.getLoadOrder()`

Gets the load order stored in `instance`, in respect of the plugins' load order priorities.

##### Returns

An array of plugins (`Plugger[]`)

##### Throws

\-

#### `instance.sortLoadOrder()`

Sorts the load order stored in `instance`. Plugins that are required by other plugins are set to intialize first. Their priorities are also taken into consideration.

##### Returns

`instance` (`Plugger`)

##### Throws

If at least one of the loaded plugins' required plugin(s) is not loaded (`Plugger.errorTypes.RequirementError`)

#### `instance.attachExitListener()`

Adds an exit event listener to `process`. This will run a function that executes `instance.shutdownAll()` when the `exit` event signal is emitted by `process`. It is recommended to only run this method on your main loader instance, as to not pollute the event with many listeners (NodeJS limited the number of listeners to 10 per event by default). Running this method multiple times on the same instance won't register multiple listeners.

##### Returns

`instance` (`Plugger`)

##### Throws

\-

#### `instance.detachExitListener()`

Removes an exit event listener from `process`. Running this method without running `attachExitListener()` first won't do anything.

##### Returns

`instance` (`Plugger`)

##### Throws

\-

#### `instance.setupConfig(envPath?: string)`

Sets up the configuration system. `envPath` is the path to the `'*.env'` file relative to the file that runs the method, defaults to `'./.env'`. All configuration changes that occured by the plugins will be saved to the `'*.env'` file. If `envPath` does not exist, it will be silently created. It is recommended to use the method on the main loader instance to keep all configurations in one place.

##### Returns

`instance` (`Plugger`)

##### Throws

\-

## How Priorities Work

There are 3 types of priorities that can be used, in order of the load order:

- **Positive priority**, which is from `0` to `Infinity`.\
  Plugins with positive number priorities will be initialized with the order from the lowest number (`0`) to the highest number (`Infinity`).

- **Undefined priority**\
  Plugins with undefined priorities will be initialized after plugins with positive number priorities with the order of which plugin gets loaded with `addPlugin()` first.

- **Negative priority**, which is from `-Infinity` to `-1`.\
  Negative priorities work like how negative indexes work in Python (ex: a plugin with the priority of `-1` will be loaded last, `-2` will be initialized second last, etc). Plugins with negative priorities will be processed after plugins with positive number priorities and undefined priorities, with the order from the lowest number (`-Infinity`) to the highest number (`-1`), and will be initialized according to their respective priorities.

All types of priorities are stackable, for example:

```javascript
...
loader.addPlugin(plugin1, { priority: 1 }); // this will be initialized first
loader.addPlugin(plugin2, { priority: 1 }); // this will be initialized after 'plugin1'. Note that its priority is the same as 'plugin1'

loader.initAll();
```

Because of their nature, plugins with negative priorities will be processed differently:

```javascript
...
loader.addPlugin(plugin1, { priority: 1 }); // this will be initialized first
loader.addPlugin(plugin2, { priority: 1 });

loader.addPlugin(plugin3, { priority: -2 }) // this will be initialized after 'plugin1', before 'plugin2'
loader.addPlugin(plugin4, { priority: -1 }) // this will be initialized after 'plugin2'

loader.initAll(); // Load order: 'plugin1', 'plugin3', 'plugin2', 'plugin4'
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
