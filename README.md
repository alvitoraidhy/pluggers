# Pluggers

[![npm](https://img.shields.io/npm/v/pluggers.svg)](https://www.npmjs.com/package/pluggers)
[![CircleCI](https://circleci.com/gh/alvitoraidhy/pluggers.svg?style=shield)](https://circleci.com/gh/alvitoraidhy/pluggers)
[![Codecov](https://codecov.io/gh/alvitoraidhy/pluggers/branch/master/graph/badge.svg?token=MZY3IEV0HS)](https://codecov.io/gh/alvitoraidhy/pluggers)

*A convenient plugin manager library.*

[pluggers](https://www.npmjs.com/package/pluggers) is designed to make modular projects easier to create. [recursive-install](https://www.npmjs.com/package/recursive-install) is recommended for making plugins truly independent.

**Warning**: there are many breaking changes for those who are upgrading from pre-v2 to v2.

- [Pluggers](#pluggers)
  - [Features & Plans](#features--plans)
  - [Installation](#installation)
  - [Usage](#usage)
  - [API](#api)
  - [How Priorities Work](#how-priorities-work)
  - [Contributing](#contributing)
  - [License](#license)

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
plugin.requirePlugin({ name: 'plugin1' });

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

Check out [this documentation page](https://alvitoraidhy.github.io/pluggers/).

## How Priorities Work

There are 3 types of priorities that can be used, in order of the load order:

- **Positive priority**, which is from `0` to `Infinity`.\
  Plugins with positive number priorities will be initialized with the order from the lowest number (`0`) to the highest number (`Infinity`).

- **Undefined priority**\
  Plugins with undefined priorities will be initialized after plugins with positive number priorities with the order of which plugin gets loaded with `addPlugin()` first.

- **Negative priority**, which is from `-Infinity` to `-1`.\
  Negative priorities work like how negative indexes work in Python (ex: a plugin with the priority of `-1` will be initialized last, `-2` will be initialized second last, etc). Plugins with negative priorities will be processed after plugins with positive number priorities and undefined priorities, with the order from the lowest number (`-Infinity`) to the highest number (`-1`), and will be initialized according to their respective priorities.

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
