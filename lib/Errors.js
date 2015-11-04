var util = require("util");

var ERRORS = {};

ERRORS.DependencyNotFound = function (id, depStack) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = "Dep not found: " + id + "\nRequired by: " + depStack;
    this.type = "DependencyNotFound";
};

// inheritance from Error
Object.keys(ERRORS).forEach(function (k) {
    util.inherits(ERRORS[k], Error);
});

module.exports = ERRORS;
