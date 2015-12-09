var Q = require("q");

function Component(id, dependencies, mod, type, optionalDeps) {
    // convert dependencies to map
    if (Array.isArray(dependencies)) {
        var deps = {};
        for (var i = 0; i < dependencies.length; ++i)
            deps[dependencies[i]] = dependencies[i];
        dependencies = deps;
    }

    // convert dependencies to map
    if (Array.isArray(optionalDeps)) {
        var optDeps = {};
        for (var j = 0; j < optionalDeps.length; ++j)
            optDeps[optionalDeps[j]] = optionalDeps[j];
        optionalDeps = optDeps;
    }

    this.id = id;
    this.dependencies = dependencies || [];
    this.optionalDeps = optionalDeps || [];
    this.singleton = mod && mod['@singleton'];
    this.type = type;
}

Component.prototype.create = function (container, prefixes) {
    var source = container._sources[this._sid];
    var loaded = this.loaded;

    var deps = this.dependencies;
    var optDeps = this.optionalDeps;
    var args = [];

    if (this.type != "setterInjection" && !this.loaded) {
        var depsKeys = Object.keys(deps);
        for (var i = 0, len = depsKeys.length; i < len; ++i) {
            var inst = container.create(deps[depsKeys[i]], this, prefixes.slice());
            if (source) {
                if (typeof source.fn.scope == 'function') {
                    inst = source.fn.scope(deps[depsKeys[i]], inst, {prefix: source.prefix, options: source.options});
                }
            }
            args.push(inst);
        }

        var optDepsKeys = Object.keys(optDeps);
        for (var j = 0, optLen = optDepsKeys.length; j < optLen; ++j) {
            var optInst = container.createOpt(optDeps[optDepsKeys[j]], this, prefixes.slice());
            if (source) {
                if (typeof source.fn.scope == 'function') {
                    optInst = source.fn.scope(optDeps[optDepsKeys[j]], optInst, {
                        prefix: source.prefix,
                        options: source.options
                    });
                }
            }
            args.push(optInst);
        }
    }

    var instance;
    var self = this;
    if (this.type == "setterInjection" && !this.loaded) {
        instance = Q(this.instantiate.apply(this, args));
        instance.then(function (i) {
            self.createGetters(i, container, prefixes.slice());
            if (typeof i._ic_init === "function") {
                i._ic_init();
            }
        });
    } else {
        instance = this.instantiate.apply(this, args);
    }

    if (!loaded && container._expose) {
        container._expose.call(container, this.id, instance, this.singleton)
    }

    return Q(instance);
};

Component.prototype.createGetters = function (instance, container, prefixes) {
    var self = this;
    Object.keys(this.dependencies).forEach(function (depKey) {
        var privateDep = "_" + depKey;
        Object.defineProperty(instance, depKey, {
            enumerable: true,
            get: function () {
                if (instance[privateDep] === undefined) {
                    instance[privateDep] = container.create(self.dependencies[depKey], null, prefixes.slice());
                }
                return instance[privateDep];
            }
        });
    });

    Object.keys(this.optionalDeps).forEach(function (depKey) {
        var privateDep = "_" + depKey;
        Object.defineProperty(instance, depKey, {
            enumerable: true,
            get: function () {
                if (instance[privateDep] === undefined) {
                    instance[privateDep] = container.createOpt(self.optionalDeps[depKey], null, prefixes.slice());
                }
                return instance[privateDep];
            }
        });
    });
};

Component.prototype.instantiate = function () {
    throw new Error("Unable to instantiate component '" + this.id + "'");
};

module.exports = Component;
