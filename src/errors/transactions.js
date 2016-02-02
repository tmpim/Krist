var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorInsufficientFunds = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 403;
	this.errorString = 'insufficient_funds';
}

util.inherits(errors.ErrorInsufficientFunds, errors.KristError);

errors.ErrorTransactionNotFound = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 404;
	this.errorString = 'transaction_not_found';
}

util.inherits(errors.ErrorTransactionNotFound, errors.KristError);