var Container = require('./container');

// needed because of https://github.com/npm/npm/issues/8952
if (!GLOBAL._electrolyte) {
    GLOBAL._electrolyte = new Container();
    GLOBAL._electrolyte.Container = Container;
    GLOBAL._electrolyte.node = require('./loaders/node');
    GLOBAL._electrolyte.node_modules = require('./loaders/node_modules');
}

module.exports = GLOBAL._electrolyte;
module.exports.setLogLevel = function (logLevel) {
    require("./utils/Logger").level(logLevel);
};


// for tests only
//var Container = require('./container');
//module.exports = new Container();
//module.exports.Container = Container;
//module.exports.node = require('./loaders/node');
//module.exports.node_modules = require('./loaders/node_modules');
//module.exports.setLogLevel = function (logLevel) {
//    require("./utils/Logger").level(logLevel);
//};
