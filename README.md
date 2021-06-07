# Pluggers

[![CircleCI](https://circleci.com/gh/alvitoraidhy/pluggers.svg?style=shield)](https://circleci.com/gh/alvitoraidhy/pluggers)
[![codecov](https://codecov.io/gh/alvitoraidhy/pluggers/branch/master/graph/badge.svg?token=MZY3IEV0HS)](https://codecov.io/gh/alvitoraidhy/pluggers)

A convenient plugin manager library.

[pluggers](https://www.npmjs.com/package/pluggers) is designed to make modular projects easier to create. [recursive-install](https://www.npmjs.com/package/recursive-install) is recommended for making plugins truly independent.

Warning: there are many breaking changes for those who are upgrading from pre-v1 to v1.

## Features & Plans

- [x] **Convenient** plugin loading and unloading
- [x] **Unrestricted access** between plugins
- [x] **Priority-based** load order (explicit or automatic)
- [ ] **Asynchronous** plugin loading (configurable)
- [ ] **JSON-based** load order & configurations

## Installation

Use the package manager **npm** to install pluggers.

```bash
npm install --save pluggers
```

## Usage

```javascript
// ./plugin1.js
const Plugger = require('./pluggers').default;

const plugin = new Plugger('plugin1');

plugin.pluginCallbacks.init = () => {
  const test = "Hello World!";
  return test
};

module.exports = plugin;
```

```javascript
// ./plugin2.js
const Plugger = require('./pluggers').default;

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

```javascript
// ./master.js
const Plugger = require('./pluggers').default;

// Create instance
const master = new Plugger('master');

// Add plugins
master.addPlugin(require('./plugin1'));
master.addPlugin(require('./plugin2'));
```

The above codes will print "Hello World!" if `master.js` is executed.

## API

Some common terms:

- **Plugger**: the main class that can act as both a plugin and a loader.
- **Plugin**: a Plugger instance that acts as a plugin.
- **Loader**: a Plugger instance that acts as a loader.
- **Loaded plugin**: a plugin that has been added/loaded to a loader by using the `addPlugin()` function.
- **Initialized plugin**: a plugin that has been initialized by a loader by using the `initPlugin()` function.

### Creating an instance

#### `Plugger(plugin_name: string)`

`plugin_name` is the name of the plugin. Don't forget to use `new`, since `Plugger` is a class.

```javascript
const Plugger = require('./pluggers').default;

const instance = new Plugger('master');
```

##### Returns

A new Plugger instance.

##### Throws

-

### As a plugin

#### `instance.pluginConfig`

- `instance.pluginConfig.metadata`: the metadata of the object (`Object`, defaults to `{}`)
- `instance.pluginConfig.defaultPriority`: the default priority of the instance (`number`, defaults to `undefinedPriority` private constant).
This can be used when a plugin is designed to work always at a specific step of an app (ex: designed to be loaded first as a core plugin or loaded last as a bootstrapper).

#### `instance.pluginCallbacks`

- `instance.pluginCallbacks.init`: callback to be run when a plugin is initializing (`(pluginsStates: { [index: string]: any }) => any`, defaults to `() => {}`).
The return value will be stored by the loader as the 'state' of the plugin. This state will be passed to any other plugins that has the plugin's name as a requirement. `init` callback function will be passed 1 argument, which is an `Object` that contains the state(s) of the instance's required plugin(s) and their names as their respective keys.

- `instance.pluginCallbacks.error`: callback to be run when a plugin encountered an uncaught error when running any of the other callbacks (`(event: string, error: Error) => void`, defaults to `() => {}`.
`event` is the event type of the callback that throws the error. `error` is the error instance. `error` callbacks do not require a return value, since it won't be stored anyways.

- `instance.pluginCallbacks.shutdown`: callback to be run when a plugin is shutting down (`(state: any) => void`, defaults to `() => {}`).
`state` is the state of the plugin that is shutting down.

#### `instance.getName()`

Returns the name of the Plugger instance.

##### Returns

the name of `instance` (`string`)

##### Throws

-

#### `instance.getContext()`

Returns the context of the Plugger instance. This context is exclusive to the instance only and directly mutable. Note that the context is not the state of the instance. It is designed to be used internally by the instance.

##### Returns

the context of `instance` (`Object`)

##### Throws

-

#### `instance.requirePlugin(pluginName: string)

Adds `pluginName` as a requirement when a loader tries to load the instance. A loader will check if a plugin with the name `pluginName` is loaded and initialized first before trying to initialize the instance.

##### Returns

`this` instance

##### Throws

- if `pluginName` is already a requirement of the instance (`Plugger.errorTypes.ConflictError`)

#### `instance.removeRequiredPlugin(pluginName:string)

Removes `pluginName` from the instance's list of required plugins.

##### Returns

`this` instance

##### Throws

- If `pluginName` is not a requirement of the instance (`Plugger.errorTypes.RequirementError`)

#### `instance.getRequiredPlugins()`

Returns the instance's list of required plugins.

#### Returns

An array of the instance's required plugins' names (`string[]`)

#### Throws

-

### As a loader

#### `instance.loaderConfig`

- `instance.loaderConfig.autoInit`: configure whether or not a plugin will be initialized automatically when loaded (`boolean`, defaults to `true`).

#### `instance.addPlugin(plugin: Plugger)`

`plugin` is a Plugger that you want to load to your loader.

##### Returns

`this` instance.

##### Throws

- if a plugin with the same name is already loaded (`Plugger.errorTypes.ConflictError`)
- if `instance.loaderConfig.autoInit` is `true` and if at least one required plugin is not loaded by the time of the execution (`Plugger.errorTypes.RequirementError`)

#### `instance.removePlugin(plugin: Plugger | string)`

`plugin` is a Plugger that you want to unload from your loader.

##### Returns

`this` instance.

##### Throws

- if `plugin` isn't loaded (`Plugger.errorTypes.NotLoadedError`)
- if `plugin` is required by at least one loaded plugin by the time of the execution (`Plugger.errorTypes.RequirementError`)

#### `instance.getPlugin(plugin_name: string)`

`plugin_name` is the name of the plugin that you want to retrieve.

##### Returns

- a Plugger instance with the same name as `plugin_name`, or
- `null` if not found

##### Throws

-

#### `instance.setCallback(event: string, func: function)`

Set a callback that runs when an event occured.

##### Returns

`this` instance

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
