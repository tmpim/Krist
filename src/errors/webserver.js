var	util        = require('util'),
	errors      = require('./errors.js');

errors.ErrorRouteNotFound = function(message) {
	errors.KristError.call(this);
	this.message = message;
	this.statusCode = 404;
	this.errorString = 'route_not_found';
}

util.inherits(errors.ErrorRouteNotFound, errors.KristError);