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

    this.inst = this.fn.apply(undefined, arguments);
    this.loaded = true;
    return this.inst;
};

module.exports = Singleton;
