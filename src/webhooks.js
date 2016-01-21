var utils   = require('./utils.js'),
	config  = require('./../config.js'),
	schemas = require('./schemas.js');

function WebHooks() {}

WebHooks.createTransactionWebhook = function(method, url, addresses) {
	return schemas.webhook.create({
		event: 'transaction',
		method: method,
		url: decodeURI(url),
		value: addresses
	});
};

WebHooks.createBlockWebhook = function(method, url) {
	return schemas.webhook.create({
		event: 'block',
		method: method,
		url: decodeURI(url)
	});
};

module.exports = WebHooks;