var Q = require("q");

var Component = require('../component');
var util = require('util');

function Factory(id, dependencies, fn, type, optionalDeps) {
    Component.call(this, id, dependencies, fn, type, optionalDeps);
    this.fn = fn;
}

util.inherits(Factory, Component);

Factory.prototype.instantiate = function () {
    var self = this;
    return Q.all(Array.prototype.slice.call(arguments)).then(function (args) {
        return self.fn.apply(undefined, args);
    });
};

module.exports = Factory;
