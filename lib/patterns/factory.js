var Component = require('../component')
  , util = require('util')
  , debug = require('debug')('electrolyte');


function Factory(id, dependencies, fn, type) {
  Component.call(this, id, dependencies, fn, type);
  this.fn = fn;
}

util.inherits(Factory, Component);

Factory.prototype.instantiate = function() {
  debug('instantiate %s', this.id);
  return this.fn.apply(undefined, arguments);
}

module.exports = Factory;
