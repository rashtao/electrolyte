module.exports = function (id, module) {
	return function (_id) {
		if (id == _id) {
			return module;
		}
	};
};
