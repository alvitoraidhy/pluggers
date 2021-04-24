# Pluggers
[![CircleCI](https://circleci.com/gh/alvitoraidhy/pluggers.svg?style=shield)](https://circleci.com/gh/alvitoraidhy/pluggers)
[![codecov](https://codecov.io/gh/alvitoraidhy/pluggers/branch/master/graph/badge.svg?token=MZY3IEV0HS)](https://codecov.io/gh/alvitoraidhy/pluggers)

A simple plugin manager library.

[pluggers](https://www.npmjs.com/package/pluggers) is designed to make modular projects easier to create. [recursive-install](https://www.npmjs.com/package/recursive-install) is recommended for independent plugins.

## Features & Plans

- [x] **Convenient** plugin loading and unloading
- [x] **Unrestricted access** between plugins
- [ ] **Asynchronous** plugin loading (configurable)
- [ ] **Explicitly stated** load order
- [ ] **JSON-based** plugin list & configurations

## Installation

Use the package manager **npm** to install pluggers.

```bash
npm install --save pluggers
```

## Usage

```javascript
// ./plugin-1.js
const Plugger = require('pluggers');

const plugin = new Plugger('plugin-1');

plugin.setInit(function() {
  var current = plugin.getParent();
  current.test = "Hello World!";
});

module.exports = plugin;
```

```javascript
// ./plugin-2.js
const Plugger = require('pluggers');

// Error will be thrown if the plugin is using a used name ("plugin-1") when loaded
const plugin = new Plugger('plugin-2');

// Error will be thrown if a plugin named "plugin-1" is not loaded
plugin.requirePlugin('plugin-1');

plugin.setInit(function() {
  var current = plugin.getParent();
  console.log(current.test); // Prints "Hello World!"
});

module.exports = plugin;
```

```javascript
// ./master.js
const Plugger = require('./pluggers');

// Create instance
const master = new Plugger('master');

// Add plugins
master.addPlugin(__dirname + '/plugin-1'); // Method 1
master.addPlugin(require('./plugin-2')); // Method 2
```

The above codes will print "Hello World!" if `master.js` is executed.

## API

### `Plugger(plugin_name: string)`

`plugin_name` is the name of the plugin. Don't forget to use `new`, since `Plugger` is a class.

```javascript
const instance = new Plugger('master');
```

#### Returns

a Plugger instance.

#### Throws

If `plugin_name` isn't a string (`TypeError`)

### `instance.addPlugin(plugin: Plugger | string)`

`plugin` can either be:

- a path to module that is exporting a Plugger instance
- a Plugger instance

#### Returns

`true`

#### Throws

- if `plugin` isn't a string or a Plugger instance (`TypeError`)
- if the module on path isn't exporting a Plugger instance (`TypeError`)
- if a plugin with the same name is already loaded (`Plugger.errorTypes.ConflictError`)
- if at least one required plugin is not loaded by the time of the execution (`Plugger.errorTypes.RequirementError`)

### `instance.removePlugin(plugin: Plugger | string)`

`plugin` can either be:

- a path to module that is exporting a Plugger instance
- a Plugger instance's name
- a Plugger instance

#### Returns

`true`

#### Throws

- if `plugin` isn't a string or a Plugger instance (`TypeError`)
- if the module on path isn't exporting a Plugger instance (`TypeError`)
- if `plugin` isn't loaded (`Plugger.errorTypes.NotLoadedError`)

### `instance.getPlugin(plugin_name: string)`

`plugin_name` is the name of the plugin that you want to retrieve.

#### Returns

- a Plugger instance with the same name as `plugin_name`, or
- `null` if not found

#### Throws

If `plugin_name` isn't a string (`TypeError`)

### `instance.getParent()`

#### Returns

- the parent Plugger instance, or
- `null` if has no parent/not loaded

### `instance.setInit(func: function)`

`func` is a function that will be executed when the plugin is getting loaded.

#### Returns

`true`

#### Throws

If `func` isn't a function (`TypeError`)

## Other Methods

### `instance.getName()`

### `instance.setName(name: string)`

### `instance.setParent(plugin: Plugger)`

### `instance.getPlugins()`

### `instance.getRequiredPlugins()`

### `instance.initPlugin()`

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
