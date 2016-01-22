var utils   = require('./utils.js'),
	config  = require('./../config.js'),
	schemas = require('./schemas.js'),
	Promise = require('bluebird'),
	url     = require('url');

function WebHooks() {}

WebHooks.isURLAllowed = function(url) {
	return new Promise(function(resolve, reject) {
		schemas.webhook.findAll().then(function(webhooks) {
			var count = 0;

			webhooks.forEach(function(webhook) {
				if(url.parse(webhook.url).hostname.toLowerCase().trim() === url.hostname.toLowerCase().trim()) {
					count++;
				}
			});

			resolve(count < config.webhooks_maxPerHost);
		}).catch(reject);
	});
};

WebHooks.createTransactionWebhook = function(owner, method, url, addresses) {
	return schemas.webhook.create({
		event: 'transaction',
		method: method,
		url: decodeURI(url),
		value: addresses,
		owner: owner
	});
};

WebHooks.createBlockWebhook = function(owner, method, url) {
	return schemas.webhook.create({
		event: 'block',
		method: method,
		url: decodeURI(url),
		owner: owner
	});
};

WebHooks.getWebhooksByOwner = function(owner) {
	return schemas.webhook.findAll({where: {owner: owner}});
};

module.exports = WebHooks;