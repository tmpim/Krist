var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorNameNotFound = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 404;
	this.errorString = 'name_not_found';
};

util.inherits(errors.ErrorNameNotFound, errors.KristError);

errors.ErrorNameTaken = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 409;
	this.errorString = 'name_taken';
};

util.inherits(errors.ErrorNameTaken, errors.KristError);