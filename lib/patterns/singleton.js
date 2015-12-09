var Q = require("q");

var Component = require('../component');
var util = require('util');

function Singleton(id, dependencies, fn, type, optionalDeps) {
    Component.call(this, id, dependencies, fn, type, optionalDeps);
    this.fn = fn;
    this.inst = undefined;
}

util.inherits(Singleton, Component);

Singleton.prototype.instantiate = function () {
    if (this.inst) {
        return this.inst;
    }

    var self = this;
    this.inst = Q.all(Array.prototype.slice.call(arguments)).then(function (args) {
        return self.fn.apply(undefined, args);
    });

    this.loaded = true;
    return this.inst;
};

module.exports = Singleton;
