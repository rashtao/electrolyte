![Logo](logo.png)
# Electrolyte

Electrolyte is a simple, lightweight [inversion of control](http://en.wikipedia.org/wiki/Inversion_of_control)
(IoC) container for Node.js applications.

Electrolyte automatically wires together the various components and services
needed by an application.  It does this using a technique known as
[dependency injection](http://en.wikipedia.org/wiki/Dependency_injection) (DI).
Using Electrolyte eliminates boilerplate code and improves software quality by
encouraging loose coupling between modules, resulting in greater reusability and
increased test coverage.

For further details about the software architecture used for IoC and dependency
injection, refer to [Inversion of Control Containers and the Dependency Injection pattern](http://martinfowler.com/articles/injection.html)
by [Martin Fowler](http://martinfowler.com/).

There are two important terms to understand when using Electrolyte:
components and annotations.

## IoC Container

IoC container can be instantiated with:

```javascript
var IoC = require('electrolyte');
```

## Components

Components are simply modules which return objects used within an application.

Components can be registered in the IoC Container, so that when required the IoC will
provide to instantiate and return the object.

Components can be declared through annotations or explicitly.

## Declaring components

A component can be declared using annotations. In the following examples we create two
components (config and service), with service depending on config:

```javascript
// config.js

exports = module.exports = {
	name: "config"
};

exports['@literal'] = true;
```

```javascript
// service.js

exports = module.exports = function (config) {
	return {
		name: "service",
		config: config
	};
};

exports['@singleton'] = true;
exports['@require'] = ['config'];
```

## Registering components

Once that a component is declared, it should be registered into the IoC. For example we
can register service1 and service2:

```javascript
IoC.register("config", require("config"));
IoC.register("service", require("service"));
```

The registration can be done providing an identifier and a component.

## Creating components

Components are created by asking the IoC container to create them:

```javascript
var IoC = require('electrolyte');
var service = IoC.create('service');
```

Electrolyte is smart enough to automatically traverse a component's dependencies
(and dependencies of dependencies, and so on), correctly wiring together the
complete object structure.

In the case of the example above, Electrolyte would first initialize the
`config` component, and then inject the result as an argument to the `service`
component. `service` would then be returned from `IoC.create`.

This automatic instantiation and injection of components eliminates the
boilerplate plumbing many application need for initialization.

We can also explicitly create the `config` component:

```javascript
var config = IoC.create('config');
```

## @require

`@require` annotation provide an extra bit of metadata about the component, which
Electrolyte uses to automatically wire together an application.
It declares the dependencies needed by the component.  These dependencies are automatically created and injected.


## Components types

There are 4 types of components and they differ in the creation phase:
- **@literal**
- **@singleton**
- **@factory**
- **@constructor**

### @literal

When a `@literal` component is created, the value (object or function) exported in the component is returned.
In the previous example we registered a `@literal` component with the identifier `config`.
So when we create the `config` component we get the object exported in `config.js`.
This is identical to requiring `config.js`, eg:

```javascript
var c1 = IoC.create('config');
var c2 = require('./config');
expect(c1).to.equal(c2);
```

### @singleton

The first time that a `@singleton` component is created, the function exported in the component is executed and the return
value will be returned for all the following times that the component will be created.

In the previous example we registered a `@singleton` component with the identifier `config`.
So every time that we create the `service` component, we get the object returned
by the first execution of the function exported in `service.js`, eg:

```javascript
var s1 = IoC.create('service');
var s2 = IoC.create('service');
expect(s1).to.equal(s2);
```

### @factory

When a `@factory` component is created, the function exported in the component is executed and the return
value is returned.

```javascript
// factory.js

var i = 0;
exports = module.exports = function () {
	return {
		index: ++i
	};
};

exports['@factory'] = true;
```

```javascript
IoC.register('factory', require('./factory'));

var f1 = IoC.create('factory');
var f2 = IoC.create('factory');
expect(f1.index).to.equal(1);
expect(f2.index).to.equal(2);
```

### @constructor

When a `@constructor` component is created, a new object is created using the function exported in the component as constructor.

```javascript
// constructor.js

var i = 0;
exports = module.exports = function () {
	this.index = ++i;
};

exports['@constructor'] = true;
```

```javascript
IoC.register('constructor', require('./constructor'));

var c1 = IoC.create('constructor');
var c2 = IoC.create('constructor');
expect(c1.index).to.equal(1);
expect(c2.index).to.equal(2);
```


## Constructor Injection

In the previous examples we used always the [Constructor Injection](https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection).
The dependencies will be injected as arguments when calling
the function exported by the component, in the same order as they are listed in the `@require` array.

With this approach, we have two main limitations:
  - the injection is made considering only the order of the paramenters
  - if we have a cycle in the dependecies graph, our code will generate a recursive loop

## Setter Injection

To avoid the limitation listed above, the [Setter Injection](https://en.wikipedia.org/wiki/Dependency_injection#Setter_injection) can be used.
For a deeper understanding check [this](http://martinfowler.com/articles/injection.html#ConstructorVersusSetterInjection).

We can use the setter injection in the following way:

```javascript
// service1.js

exports = module.exports = function () {
   return {
	   name: "service1",
	   service2: service2
   };
};

exports['@singleton'] = true;
exports['@require'] = ['service2'];
exports['@type'] = 'setterInjection';
```

```javascript
// service2.js

exports = module.exports = function () {
	return {
        name: "service2",
        service1: service1
    };
};

exports['@singleton'] = true;
exports['@require'] = ['service1'];
exports['@type'] = 'setterInjection';
```

```javascript
IoC.register('service1', service1);
IoC.register('service2', service2);

var s1 = IoC.create('service1');
var s2 = IoC.create('service2');

expect(s1.service2).to.equal(s2);
expect(s2.service1).to.equal(s1);
```

### Specifying field names

Using the Setter Injection the required dependencies can be specified also using a map in place of a list.
With this approach, the key of a map entry specifies the name of the field of the component that we are creating,
and the value of a map entry specifies the name of the component that will be injected in that field. For example, We can rewrite the
previous example injecting the same dependencies in other fields:

```javascript
// service1.js

exports = module.exports = function () {
   return {
	   name: "service1",
	   other: service2
   };
};

exports['@singleton'] = true;
exports['@require'] = {other: 'service2'};
exports['@type'] = 'setterInjection';
```

```javascript
// service2.js

exports = module.exports = function () {
	return {
        name: "service2",
        other: service1
    };
};

exports['@singleton'] = true;
exports['@require'] = {other: 'service1'};
exports['@type'] = 'setterInjection';
```

```javascript
IoC.register('service1', service1);
IoC.register('service2', service2);

var s1 = IoC.create('service1');
var s2 = IoC.create('service2');

expect(s1.other).to.equal(s2);
expect(s2.other).to.equal(s1);
```








## Examples

- __[electrolyte-test](https://github.com/rashtao/electrolyte-test)__
  A full test of all the functionalities.

## Tests

    $ npm install
    $ npm test

## Credits

  - [Michele Rastelli](http://github.com/rashtao)
  - [Jared Hanson](http://github.com/jaredhanson)
  - Atomic by Cengiz SARI from The Noun Project
  - [Colour palette](http://www.colourlovers.com/palette/912371/Electrolytes)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2013 Jared Hanson <[http://jaredhanson.net/](http://jaredhanson.net/)>
