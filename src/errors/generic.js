var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorInvalidParameter = function(parameter, message) {
	KristError.call(this);
	this.message = message;
	this.errorString = 'invalid_parameter';
	this.statusCode = 400;
}

util.inherits(errors.ErrorInvalidParameter, errors.KristError);

errors.ErrorMissingParameter = function(parameter, message) {
	KristError.call(this);
	this.message = message;
	this.errorString = 'missing_parameter';
	this.statusCode = 400;
	this.parameter = parameter;
}

util.inherits(errors.ErrorMissingParameter, errors.KristError);