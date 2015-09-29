var Component = require('../component');
var util = require('util');

function Literal(id, dependencies, obj, type, optionalDeps) {
    Component.call(this, id, dependencies, obj, type, optionalDeps);
    this.obj = obj;
    this.loaded = false;
}

util.inherits(Literal, Component);

Literal.prototype.instantiate = function () {
    this.loaded = true;
    return this.obj;
};

module.exports = Literal;
