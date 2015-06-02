module.exports = function () {
	return function (filePath) {
		return require(filePath);
	};
};
