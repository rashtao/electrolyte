var Container = require('./container');


exports = module.exports = new Container();

exports.Container = Container;

exports.node = require('./loaders/node');
exports.node_modules = require('./loaders/node_modules');



//if (!GLOBAL._electrolyte) {
//    GLOBAL._electrolyte = new Container();
//    GLOBAL._electrolyte.Container = Container;
//    GLOBAL._electrolyte.node = require('./loaders/node');
//    GLOBAL._electrolyte.node_modules = require('./loaders/node_modules');
//}
//
//module.exports = GLOBAL._electrolyte;

