var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorServerNotVerified = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.errorString = 'server_not_verified';
};

util.inherits(errors.ErrorServerNotVerified, errors.KristError);