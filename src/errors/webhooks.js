var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorWebhookNotFound = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 404;
	this.errorString = 'webhook_not_found';
};

util.inherits(errors.ErrorWebhookNotFound, errors.KristError);

errors.ErrorLimitReached = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 403;
	this.errorString = 'limit_reached';
};

util.inherits(errors.ErrorLimitReached, errors.KristError);