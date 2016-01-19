var utils   = require('./utils.js'),
	config  = require('./../config.js'),
	schemas = require('./schemas.js'),
	validurl = require('valid-url');

function WebHooks() {}

WebHooks.isValidURL = function(url) {
	return validurl.isWebUri(url);
};

module.exports = WebHooks;