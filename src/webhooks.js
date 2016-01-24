var utils   = require('./utils.js'),
	config  = require('./../config.js'),
	schemas = require('./schemas.js'),
	Promise = require('bluebird'),
	url     = require('url'),
	request = require('request');

function WebHooks() {}

WebHooks.isURLAllowed = function(urlParts) {
	return new Promise(function(resolve, reject) {
		schemas.webhook.findAll().then(function(webhooks) {
			var count = 0;

			webhooks.forEach(function(webhook) {
				if(url.parse(webhook.url).hostname.toLowerCase().trim() === urlParts.hostname.toLowerCase().trim()) {
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

WebHooks.createNameWebhook = function(owner, method, url, addresses) {
	return schemas.webhook.create({
		event: 'name',
		method: method,
		url: decodeURI(url),
		value: addresses,
		owner: owner
	});
};

WebHooks.callNameWebhooks = function(name, owner) {
	schemas.webhook.findAll({where: {event: 'name', value: {$or: [null, '', {$like: owner }]}}}).then(function(webhooks) {
		if (webhooks) {
			webhooks.forEach(function(webhook) {
				if (webhook.method.toLowerCase() === 'post') {
					request.post(webhook.url, {
						form: {
							ok: true,
							type: 'webhook',
							event: 'name',
							name: name,
							owner: owner
						}
					});
				} else {
					request.get(webhook.url, {
						qs: {
							ok: true,
							type: 'webhook',
							event: 'name',
							name: name,
							owner: owner
						}
					});
				}
			});
		}
	});
};

WebHooks.getWebhookById = function(id) {
	return schemas.webhook.findById(id);
};

WebHooks.getWebhooksByOwner = function(owner) {
	return schemas.webhook.findAll({where: {owner: owner}});
};

module.exports = WebHooks;