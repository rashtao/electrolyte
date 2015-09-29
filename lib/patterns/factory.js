var Component = require('../component');
var util = require('util');

function Factory(id, dependencies, fn, type, optionalDeps) {
    Component.call(this, id, dependencies, fn, type, optionalDeps);
    this.fn = fn;
}

util.inherits(Factory, Component);

Factory.prototype.instantiate = function () {
    return this.fn.apply(undefined, arguments);
};

module.exports = Factory;
