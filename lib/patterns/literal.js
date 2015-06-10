var Component = require('../component')
  , util = require('util');


function Literal(id, dependencies, obj, type) {
  Component.call(this, id, dependencies, obj, type);
  this.obj = obj;
  this.loaded = true;
}

util.inherits(Literal, Component);

Literal.prototype.instantiate = function() {
  return this.obj;
}

module.exports = Literal;
