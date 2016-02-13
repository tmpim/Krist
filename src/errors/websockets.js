var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorInvalidWebsocketToken = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 403;
	this.errorString = 'invalid_token';
};

util.inherits(errors.ErrorInvalidWebsocketToken, errors.KristError);