# Pluggers

A simple plugin manager library.

`pluggers` is designed to make modular projects easier to create.

## Installation

Use the package manager **npm** to install pluggers.

```bash
npm install --save pluggers
```

## Usage

*./master.js*
```javascript
const Plugger = require('pluggers');

// Create instance
const master = new Plugger('master');

// Add Plugs
master.addPlug(__dirname + '/plugin-1');
master.addPlug(__dirname + '/plugin-2');
```

*./plugin-1.js*
```javascript
const Plugger = require('pluggers');

const plug = new Plugger('plugin-1');

plug.setInit(function() {
  var current = plug.getParent();
  current.test = "Hello World!";
});

module.exports = plug;
```

*./plugin-2.js*
```javascript
const Plugger = require('pluggers');

// Error will be thrown if the plug is using an used name ("plugin-1").
const plug = new Plugger('plugin-2');

// Error will be thrown if a plug named "plugin-1" is not loaded.
plug.requirePlug('plugin-1');

plug.setInit(function() {
  var current = plug.getParent();
  console.log(current.test); // Prints "Hello World!"
});

module.exports = plug;
```

## API


### `Plugger(plug_name)`

`plug_name` is the name of the Plug (string).

Don't forget to use `new`, since `Plugger` is a class.

```javascript
const instance = new Plugger('master');
```

###### Returns

a Plugger instance.

###### Throws

If `plug_name` isn't a string (`TypeError`)


### `instance.addPlug(plug)`

`plug` can either be: 
- a path to module that is exporting a Plugger instance
- a Plugger instance

###### Returns

`true`

###### Throws

- if `plug` isn't a string or a Plugger instance (`TypeError`)
- if the module on path isn't exporting a Plugger instance (`Error`)
- if a Plug with the same name already added (`Error`)


### `instance.removePlug(plug)`

The same as `addPlug`.

###### Returns

`true`

###### Throws

- if `plug` isn't a string or a Plugger instance (`TypeError`)
- if the module on path isn't exporting a Plugger instance (`Error`)
- if `plug` isn't loaded (`Error`)


### `instance.getPlug(plug_name)`

`plug_name` is the name of the Plug that you want to get.

###### Returns

- a Plug instance with the same name as `plug_name`, or
- `null` if not found.


### `instance.getParent()`

###### Returns

the parent Plug instance.


### `instance.setInit(func)`

`func` is a function that will be executed when Plug is added by other Plug.

###### Returns

`true`

###### Throws

If `func` isn't a function (`TypeError`)


## Other Methods

### `instance.getName()`

### `instance.setName(name)`

### `instance.setParent(plug)`

### `instance.getPlugs()`

### `instance.getRequiredPlugs()`

### `instance.initPlug()`


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)

*README created using [Make a README](https://www.makeareadme.com/)*
