var	util    = require('util'),
	fs      = require('fs'),
	path    = require('path');

var errors = {};

errors.KristError = function(message) {
	Error.call(this);
	this.message = message;
	this.errorString = 'unknown_error';
	this.statusCode = 500;

	this.info = {};
};

util.inherits(errors.KristError, Error);

module.exports = errors;

try {
	var findPath = path.join(__dirname, './');

	fs.readdirSync(findPath).forEach(function(file) {
		if (path.extname(file).toLowerCase() !== '.js' ||
			path.basename(file).toLowerCase() === path.basename(this.filename).toLowerCase()) {

			return;
		}

		try {
			require('./' + file);
		} catch (error) {
			console.log('[Error]'.red + ' Uncaught error: `' + file + '`: ');
			console.log(error.stack);
		}
	});
} catch (error) {
	console.log('[Error]'.red + ' Uncaught error: ');
	console.log(error.stack);
}

module.exports = errors;