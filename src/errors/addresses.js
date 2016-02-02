var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorAddressNotFound = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 404;
	this.errorString = 'not_found';
}

util.inherits(errors.ErrorAddressNotFound, errors.KristError);