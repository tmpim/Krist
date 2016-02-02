var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorAddressNotFound = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 404;
	this.errorString = 'address_not_found';
}

util.inherits(errors.ErrorAddressNotFound, errors.KristError);

errors.ErrorAuthFailed = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 401;
	this.errorString = 'auth_failed';
}

util.inherits(errors.ErrorAuthFailed, errors.KristError);