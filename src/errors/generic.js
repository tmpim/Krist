var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorInvalidParameter = function(parameter, message) {
	errors.KristError.call(this);
	this.message = message;
	this.errorString = 'invalid_parameter';
	this.statusCode = 400;
	this.parameter = parameter;

	this.info = {
		parameter: parameter
	};
};

util.inherits(errors.ErrorInvalidParameter, errors.KristError);

errors.ErrorMissingParameter = function(parameter, message) {
	errors.KristError.call(this);
	this.message = message;
	this.errorString = 'missing_parameter';
	this.statusCode = 400;
	this.parameter = parameter;

	this.info = {
		parameter: parameter
	};
};

util.inherits(errors.ErrorMissingParameter, errors.KristError);