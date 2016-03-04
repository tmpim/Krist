/**
 * Created by Drew Lemmy, 2016
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

function Webhooks() {}

module.exports = Webhooks;

var utils   = require('./utils.js'),
	config  = require('./../config.js'),
	schemas = require('./schemas.js'),
	blocks  = require('./blocks.js'),
	names   = require('./names.js'),
	tx		= require('./transactions.js'),
	Promise = require('bluebird'),
	url     = require('url'),
	request = require('request'),
	moment  = require('moment'),
	hat		= require('hat');

Webhooks.isURLAllowed = function(urlParts) {
	return new Promise(function(resolve, reject) {
		schemas.webhook.findAll().then(function(webhooks) {
			var count = 0;

			webhooks.forEach(function(webhook) {
				if(url.parse(webhook.url).hostname.toLowerCase().trim() === urlParts.hostname.toLowerCase().trim()) {
					count++;
				}
			});

			resolve(count < config.maxWebsocketsPerHost);
		}).catch(reject);
	});
};

Webhooks.createTransactionWebhook = function(owner, method, url, addresses) {
	return schemas.webhook.create({
		event: 'transaction',
		method: method,
		url: decodeURI(url),
		value: addresses,
		owner: owner,
		token: 'tx-' + hat(64, 36)
	});
};

Webhooks.createBlockWebhook = function(owner, method, url) {
	return schemas.webhook.create({
		event: 'block',
		method: method,
		url: decodeURI(url),
		owner: owner,
		token: 'bk-' + hat(64, 36)
	});
};

Webhooks.createNameWebhook = function(owner, method, url, addresses) {
	return schemas.webhook.create({
		event: 'name',
		method: method,
		url: decodeURI(url),
		value: addresses,
		owner: owner,
		token: 'nm-' + hat(64, 36)
	});
};

Webhooks.callNameWebhooks = function(name) {
	schemas.webhook.findAll({where: {event: 'name', value: {$or: [null, '', {$like: '%' + name.owner + '%'}]}}}).then(function(webhooks) {
		if (webhooks) {
			var data = {
				ok: true,
				type: 'webhook',
				event: 'name',
				name: names.nameToJSON(name)
			};

			webhooks.forEach(function(webhook) {
				var updatedData = data;
				updatedData.token = webhook.token;

				if (webhook.method.toLowerCase() === 'post') {
					request.post(webhook.url, { form: updatedData }, function(err, response, body) {});
				} else {
					request.get(webhook.url, { qs: updatedData }, function(err, response, body) {});
				}
			});
		}
	});
};

Webhooks.callTransactionWebhooks = function(transaction) {
	schemas.webhook.findAll({where: {event: 'transaction', value: {$or: [null, '', {$like: '%' + transaction.from + '%'}, {$like: '%' + transaction.to + '%'}]}}}).then(function(webhooks) {
		if (webhooks) {
			var data = {
				ok: true,
				type: 'webhook',
				event: 'transaction',
				transaction: tx.transactionToJSON(transaction)
			};

			webhooks.forEach(function(webhook) {
				var updatedData = data;
				updatedData.token = webhook.token;

				if (webhook.method.toLowerCase() === 'post') {
					request.post(webhook.url, { form: updatedData }, function(err, response, body) {});
				} else {
					request.get(webhook.url, { qs: updatedData }, function(err, response, body) {});
				}
			});
		}
	});
};

Webhooks.callBlockWebhooks = function(block, newWork) {
	schemas.webhook.findAll({where: {event: 'block', value: {$or: [null, '', {$like: '%' + block.address + '%'}]}}}).then(function(webhooks) {
		if (webhooks) {
			var data = {
				ok: true,
				type: 'webhook',
				event: 'block',
				block: blocks.blockToJSON(block),
				new_work: newWork
			};

			webhooks.forEach(function(webhook) {
				var updatedData = data;
				updatedData.token = webhook.token;

				if (webhook.method.toLowerCase() === 'post') {
					request.post(webhook.url, { form: updatedData }, function(err, response, body) {});
				} else {
					request.get(webhook.url, { qs: updatedData }, function(err, response, body) {});
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