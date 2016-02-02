var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorBlockNotFound = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 404;
	this.errorString = 'not_found';
}

util.inherits(errors.ErrorBlockNotFound, errors.KristError);

errors.ErrorSolutionIncorrect = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 403;
	this.errorString = 'solution_incorrect';
}

util.inherits(errors.ErrorSolutionIncorrect, errors.KristError);