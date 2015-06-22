var debug = require('debug')('electrolyte');


function Component(id, dependencies, mod, type) {
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
		for (var i = 0, len = deps.length; i < len; ++i) {
			var inst = container.create(deps[i], this, prefixes);
			if (source) {
				if (typeof source.fn.scope == 'function') {
					inst = source.fn.scope(deps[i], inst, {prefix: source.prefix, options: source.options});
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
	this.dependencies.forEach(function (dep) {
		var privateDep = "_" + dep;
		Object.defineProperty(i, dep, {
			enumerable: true,
			get: function () {
				if (i[privateDep] === undefined) {
					i[privateDep] = container.create(dep, null, prefixes);
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
