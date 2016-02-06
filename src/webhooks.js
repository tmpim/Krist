var utils   = require('./utils.js'),
	config  = require('./../config.js'),
	schemas = require('./schemas.js'),
	Promise = require('bluebird'),
	url     = require('url'),
	request = require('request'),
	moment  = require('moment');

function Webhooks() {}

Webhooks.isURLAllowed = function(urlParts) {
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

Webhooks.createTransactionWebhook = function(owner, method, url, addresses) {
	return schemas.webhook.create({
		event: 'transaction',
		method: method,
		url: decodeURI(url),
		value: addresses,
		owner: owner
	});
};

Webhooks.createBlockWebhook = function(owner, method, url) {
	return schemas.webhook.create({
		event: 'block',
		method: method,
		url: decodeURI(url),
		owner: owner
	});
};

Webhooks.createNameWebhook = function(owner, method, url, addresses) {
	return schemas.webhook.create({
		event: 'name',
		method: method,
		url: decodeURI(url),
		value: addresses,
		owner: owner
	});
};

Webhooks.callNameWebhooks = function(name) {
	schemas.webhook.findAll({where: {event: 'name', value: {$or: [null, '', {$like: name.owner}]}}}).then(function(webhooks) {
		if (webhooks) {
			var data = {
				ok: true,
				type: 'webhook',
				event: 'name',
				name: {
					name: name.name,
					owner: name.owner,
					registered: moment(name.registered).format('YYYY-MM-DD HH:mm:ss').toString(),
					registered_unix: moment(name.registered).unix(),
					updated: moment(name.updated).format('YYYY-MM-DD HH:mm:ss').toString(),
					updated_unix: moment(name.updated).unix(),
					a: name.a
				}
			};

			webhooks.forEach(function(webhook) {
				if (webhook.method.toLowerCase() === 'post') {
					request.post(webhook.url, { form: data }, function(err, response, body) {});
				} else {
					request.get(webhook.url, { qs: data }, function(err, response, body) {});
				}
			});
		}
	});
};

Webhooks.callTransactionWebhooks = function(transaction) {
	schemas.webhook.findAll({where: {event: 'transaction', value: {$or: [null, '', {$like: transaction.from}, {$like: transaction.to}]}}}).then(function(webhooks) {
		if (webhooks) {
			var data = {
				ok: true,
				type: 'webhook',
				event: 'transaction',
				transaction: {
					id: transaction.id,
					from: transaction.from,
					to: transaction.to,
					value: transaction.value,
					time: moment(transaction.time).format('YYYY-MM-DD HH:mm:ss').toString(),
					time_unix: moment(transaction.time).unix(),
					name: transaction.name,
					op: transaction.op
				}
			};

			webhooks.forEach(function(webhook) {
				if (webhook.method.toLowerCase() === 'post') {
					request.post(webhook.url, { form: data }, function(err, response, body) {});
				} else {
					request.get(webhook.url, { qs: data }, function(err, response, body) {});
				}
			});
		}
	});
};

Webhooks.callBlockWebhooks = function(block) {
	schemas.webhook.findAll({where: {event: 'block', value: {$or: [null, '', {$like: block.address}]}}}).then(function(webhooks) {
		if (webhooks) {
			var data = {
				ok: true,
				type: 'webhook',
				event: 'block',
				block: {
					height: block.id,
					address: block.address,
					hash: block.hash,
					short_hash: block.hash.substring(0, 12),
					value: block.value,
					time: moment(block.time).format('YYYY-MM-DD HH:mm:ss').toString(),
					time_unix: moment(block.time).unix()
				}
			};

			webhooks.forEach(function(webhook) {
				if (webhook.method.toLowerCase() === 'post') {
					request.post(webhook.url, { form: data }, function(err, response, body) {});
				} else {
					request.get(webhook.url, { qs: data }, function(err, response, body) {});
				}
			});
		}
	});
};

Webhooks.getWebhookById = function(id) {
	return schemas.webhook.findById(id);
};

Webhooks.getWebhooksByAddress = function(address) {
	return schemas.webhook.findAll({where: {owner: address}});
};

Webhooks.getWebhookCountByAddress = function(address) {
	return schemas.webhook.count({where: {owner: address}});
};

module.exports = Webhooks;