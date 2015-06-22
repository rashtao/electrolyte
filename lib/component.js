var debug = require('debug')('electrolyte');


function Component(id, dependencies, mod, type) {

    // convert dependencies to map
    if (Array.isArray(dependencies)) {
        var deps = {};
        for (var i = 0; i < dependencies.length; ++i)
            deps[dependencies[i]] = dependencies[i];
        dependencies = deps;
    }

    this.id = id;
    this.dependencies = dependencies;
    this.singleton = mod && mod['@singleton'];
    this.type = type;
}

Component.prototype.create = function (container, prefixes) {
    debug('create %s', this.id);

    var source = container._sources[this._sid];
    var loaded = this.loaded;

    var deps = this.dependencies
        , args = [];

    if (this.type != "setterInjection" && !this.loaded) {
        var depsKeys = Object.keys(deps);
        for (var i = 0, len = depsKeys.length; i < len; ++i) {
            var inst = container.create(deps[depsKeys[i]], this, prefixes);
            if (source) {
                if (typeof source.fn.scope == 'function') {
                    inst = source.fn.scope(deps[depsKeys[i]], inst, {prefix: source.prefix, options: source.options});
                }
            }
            args.push(inst);
        }
    }

    if (this.type == "setterInjection" && !this.loaded) {
        var i = this.instantiate.apply(this, args);
        this.createGetters(i, container, prefixes);
    } else {
        var i = this.instantiate.apply(this, args);
    }

    if (!loaded && container._expose) {
        container._expose.call(container, this.id, i, this.singleton)
    }

    return i;
}

Component.prototype.createGetters = function (i, container, prefixes) {
    var self = this;
    Object.keys(this.dependencies).forEach(function (depKey) {
        var privateDep = "_" + depKey;
        Object.defineProperty(i, depKey, {
            enumerable: true,
            get: function () {
                if (i[privateDep] === undefined) {
                    i[privateDep] = container.create(self.dependencies[depKey], null, prefixes);
                }
                return i[privateDep];
            }
        });
    });
};

Component.prototype.instantiate = function () {
    throw new Error("Unable to instantiate component '" + this.id + "'");
}

module.exports = Component;
