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
There are 4 types of components:
- literal
- singleton
- constructor
- factory

Components can be registered in the IoC Container, so that when required the IoC will
provide to instantiate and return the object.

Components can be declared through annotations or explicitly.

### Declaring components by annotations

A component can be declared using annotations. In the following examples we create two
components (service1 and service2), with service2 depending on service1:

```javascript
// service1.js

var MyService = function () {
	this.name = "service1";
};

exports = module.exports = function () {
	return new MyService();
};

exports['@singleton'] = true;
```

```javascript
// service2.js

var MyService = function (service1) {
	this.service1 = service1;
	this.name = "service2";
};

exports = module.exports = function (service1) {
	return new MyService(service1);
};

exports['@singleton'] = true;
exports['@require'] = ['service1'];
```

### Registering components

Once that a component is declared, it should be registered into the IoC. For example we
can register service1 and service2:

```javascript
IoC.register("service1", require("service1"));
IoC.register("service2", require("service2"));
```

### Creating components

Components are created by asking the IoC container to create them:

```javascript
var IoC = require('electrolyte');
var service2 = IoC.create('service2');
```

Electrolyte is smart enough to automatically traverse a component's dependencies
(and dependencies of dependencies, and so on), correctly wiring together the
complete object structure.

In the case of the example above, Electrolyte would first initialize the
`service1` component, and then inject the result as an argument to the `service2`
component.  `service2` would then be returned from `IoC.create`.

This automatic instantiation and injection of components eliminates the
boilerplate plumbing many application need for initialization.


## Constructor Injection

as arguments (in the same
   order as listed in the array)

## Setter Injection


## Annotations

Annotations provide an extra bit of metadata about the component, which
Electrolyte uses to automatically wire together an application.

- `@require`  Declares the dependencies needed by the component.  These
   dependencies are automatically created and injected.






- `@singleton`  Indicates that the component returns a singleton object, which
  should be shared by all components in the application.




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
