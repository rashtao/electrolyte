var util = require("util");

var ERRORS = {};

ERRORS.DependencyNotFound = function (id, depStack) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Dep not found: " + id + "\nRequired by: " + depStack;
    this.type = "DependencyNotFound";
};

ERRORS.RecursiveDependencyFound = function (id, depStack) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "RecursiveDependencyFound found for " + id + ":\n" + depStack;
    this.type = "RecursiveDependencyFound";
};

// inheritance from Error
Object.keys(ERRORS).forEach(function (k) {
    util.inherits(ERRORS[k], Error);
});

module.exports = ERRORS;
