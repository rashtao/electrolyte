var log = require("./utils/Logger");

/**
 * Module dependencies.
 */
var path = require('path')
    , Factory = require('./patterns/factory')
    , Singleton = require('./patterns/singleton')
    , Constructor = require('./patterns/constructor')
    , Literal = require('./patterns/literal');


/**
 * `Container` constructor.
 *
 * A container contains a set of named object instances, known as components.
 * These components are automatically created when needed and injected into
 * other components that require them.
 *
 * A default `Container` singleton is exported via the module.  Applications
 * should not need to construct additional instances, and are advised against
 * doing so.
 *
 * @api public
 */
function Container() {
    this._o = {};
    this._sources = {};
    this._order = [];
    this._expose = undefined;
}

/**
 * Create a component.
 *
 * When the component being created requires other components (using `@require`
 * annotations), those components will automatically be created and injected
 * into the component.  In this way, complex graphs of objects can be
 * constructed with a single line of code, eliminating extraneous boilerplate.
 *
 * A component can be annotated as being a singletion (using `@singleton`).  If
 * so, only one instance of the named component will be created.  Subsequent
 * calls to create the component will return the singleton instance.
 *
 * Examples:
 *
 *     var foo = IoC.create('foo');
 *
 *     var boop = IoC.create('beep/boop');
 *
 * @param {String} id
 * @return {mixed}
 * @api public
 * @param parent
 * @param stack
 */
Container.prototype.create = function (id, parent, stack) {
    log.debug("Container.prototype.create", arguments);

    parent = parent || {};
    stack = stack || [];
    stack.push(id);

    var alternatives = generateAlternatives(stack);
    log.debug("alternatives", alternatives);

    for (var i in alternatives) {
        var cid = alternatives[i];
        var p = this._create(cid, parent, stack);
        if (p.found) {
            log.info("Providing " + cid + " for " + stack.join(Container.nestedResourcesSeparator));
            return p.comp;
        }
    }

    log.warn("Dep not found: ", id, "\nRequired by: ", stack.join(Container.nestedResourcesSeparator));
    throw new Error("Unable to create component: " + id + "\nRequired by: " + stack.join(Container.nestedResourcesSeparator));
};

var Combinatorics = require('js-combinatorics');
function generateAlternatives(stack) {
    log.debug("generateAlternatives", arguments);

    return Combinatorics.power(stack.slice().reverse()).toArray().reverse()
        .filter(function (i) {
            return i[0] == stack[stack.length - 1];
        })
        .map(function (i) {
            return i.reverse().join(Container.nestedResourcesSeparator);
        });
}

Container.prototype.createOpt = function (id, parent, stack) {
    log.debug("Container.prototype.createOpt", arguments);
    var self = this;
    try {
        return self.create(id, parent, stack);
    } catch (e) {
        log.warn("Optional dep not found: ", id, "\nRequired by: ", stack.join(Container.nestedResourcesSeparator));
        return null;
    }
};

Container.nestedResourcesSeparator = ".";

Container.prototype._create = function (id, parent, stack) {
    if (parent && id[0] == '.') {
        // resolve relative component ID
        // TODO: Ensure that this uses '/' as a separator on Windows
        id = path.join(path.dirname(parent.id), id);
    }

    // special modules
    switch (id) {
        case '$container':
            return this;
    }

    var comp = this._o[id];
    if (!comp) {
        // No component is registered with the given ID.  Attempt to register the
        // component by loading its corresponding module.
        this._loadModule(id);
    }

    comp = this._o[id];
    if (!comp) {
        return {
            found: false
        };
    }

    return {
        found: true,
        comp: comp.create(this, stack)
    };
}

Container.prototype.factory = function (id, fn, dependencies, type, optionalDeps) {
    log.info("Container.prototype.factory", arguments);
    dependencies = dependencies || fn['@require'] || [];
    optionalDeps = optionalDeps || fn['@optional'] || [];
    type = type || fn['@type'] || 'constructorInjection';
    this._register(new Factory(id, dependencies, fn, type, optionalDeps));
};

Container.prototype.singleton = function (id, fn, dependencies, type, optionalDeps) {
    log.info("Container.prototype.singleton", arguments);
    dependencies = dependencies || fn['@require'] || [];
    optionalDeps = optionalDeps || fn['@optional'] || [];
    type = type || fn['@type'] || 'constructorInjection';
    this._register(new Singleton(id, dependencies, fn, type, optionalDeps));
};

Container.prototype.constructor = function (id, ctor, dependencies, type, optionalDeps) {
    log.info("Container.prototype.constructor", arguments);
    dependencies = dependencies || ctor['@require'] || [];
    optionalDeps = optionalDeps || ctor['@optional'] || [];
    type = type || ctor['@type'] || 'constructorInjection';
    this._register(new Constructor(id, dependencies, ctor, type, optionalDeps));
};

Container.prototype.literal = function (id, obj, dependencies, type, optionalDeps) {
    log.info("Container.prototype.literal", arguments);
    dependencies = dependencies || (obj && obj['@require']) || [];
    optionalDeps = optionalDeps || (obj && obj['@optional']) || [];
    type = type || (obj && obj['@type']) || 'constructorInjection';
    this._register(new Literal(id, dependencies, obj, type, optionalDeps));
};

Container.prototype._register = function (comp) {
    // TODO: Pass sid to constructor (??)
    this._o[comp.id] = comp;
};

var anonymousCount = 0;
/**
 * Execute a function injecting all its deps
 * @param module: function to execute
 * @param dependencies
 * @param mode
 * @param type
 * @param optionalDeps
 * @returns {mixed}
 */
Container.prototype.exec = function (module, dependencies, mode, type, optionalDeps) {
    log.info("Container.prototype.exec", arguments);
    var id = "_anonymous_" + anonymousCount++;
    this.register(id, module, dependencies, mode, type, optionalDeps);
    return this.create(id);
};

Container.prototype.register = function (id, module, dependencies, mode, type, optionalDeps) {
    log.info("Container.prototype.register", arguments);
    if (dependencies != null && (!dependencies instanceof Object || typeof dependencies === "string")) {
        optionalDeps = type;
        type = mode;
        mode = dependencies;
        dependencies = null;
    }

    mode = mode || this.getModuleType(module) || "@factory";

    if (mode == "@singleton") {
        return this.singleton(id, module, dependencies, type, optionalDeps);
    } else if (mode == "@factory") {
        return this.factory(id, module, dependencies, type, optionalDeps);
    } else if (mode == "@constructor") {
        return this.constructor(id, module, dependencies, type, optionalDeps);
    } else if (mode == "@literal") {
        return this.literal(id, module, dependencies, type, optionalDeps);
    } else {
        throw new Error("Unknown mode: " + mode);
    }
};

Container.prototype.getModuleType = function (module) {
    if (module["@singleton"]) {
        return "@singleton";
    } else if (module["@factory"]) {
        return "@factory";
    } else if (module["@constructor"]) {
        return "@constructor";
    } else if (module["@literal"]) {
        return "@literal";
    } else {
        return null;
    }
};

Container.prototype.loader =
    Container.prototype.use = function (prefix, fn, options) {
        log.info("Container.prototype.loader", arguments);
        if (typeof prefix == 'function') {
            fn = prefix;
            prefix = '';
        }
        if (typeof fn != 'function') {
            // Adding a loader that isn't a function is bad mojo
            throw new Error("Loader requires a function, was passed a '" + (typeof fn) + "'");

        }
        if (prefix.length && prefix[prefix.length - 1] != '/') {
            prefix += '/';
        }
        var id = this._order.length;
        this._sources[id] = {prefix: prefix, fn: fn, options: options};
        this._order.push({id: id, prefix: prefix, fn: fn});
    }

Container.prototype.expose = function (cb) {
    this._expose = cb;
}

Container.prototype._loadModule = function (id) {
    var sources = this._order
        , source, prefix, rid, mod;
    for (var i = 0, len = sources.length; i < len; ++i) {
        source = sources[i];
        prefix = source.prefix;
        if (id.indexOf(prefix) !== 0) {
            continue;
        }
        rid = id.slice(prefix.length);
        mod = source.fn(rid);

        if (mod) {
            this._registerModule(id, mod);
            break;
        }
    }
}

Container.prototype._registerModule = function (id, mod) {
    var dependencies = mod['@require'] || []
        , pattern = '@literal';

    if (typeof mod == 'function') {
        var name = mod.name || 'anonymous';
        if (name[0] == name[0].toUpperCase()) {
            pattern = '@constructor';
        } else {
            if (mod['@singleton']) {
                pattern = '@singleton';
            } else {
                pattern = '@factory';
            }
        }

        if (mod['@literal'] === true) {
            pattern = '@literal';
        }
    }

    pattern = this.getModuleType(mod) || pattern;

    // TODO: Clean this up.  Singleton should be eliminated and handled
    //       as an option by both factory and constructor patterns.
    switch (pattern) {
        case '@factory':
            this.factory(id, mod, dependencies);
            break;
        case '@singleton':
            this.singleton(id, mod, dependencies);
            break;
        case '@constructor':
            this.constructor(id, mod, dependencies);
            break;
        case '@literal':
            this.literal(id, mod);
            break;
    }
};

module.exports = Container;
