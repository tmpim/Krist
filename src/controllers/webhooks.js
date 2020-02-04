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

var config  = require('./../../config.js'),
	webhooks    = require('./../webhooks.js'),
	names       = require('./../names.js'),
	errors      = require('./../errors/errors.js'),
	addrs   	= require('./../addresses.js'),
	krist       = require('./../krist.js'),
	url         = require('url');

function WebhooksController() {}

WebhooksController.registerWebhook = function(privatekey, owner, event, destURL, method, addresses) {
	return new Promise(function(resolve, reject) {
		if (config.webhooksDeprecated) return reject(new errors.ErrorWebhooksDeprecated("Webhooks are now deprecated. Consider switching to Websockets instead, or contact Lemmmy#8924 to discuss your use case."));

		if (!privatekey) {
			return reject(new errors.ErrorMissingParameter('privatekey'));
		}

		if (!owner) {
			return reject(new errors.ErrorMissingParameter('owner'));
		}

		if (!event) {
			return reject(new errors.ErrorMissingParameter('event'));
		}

		if (!destURL) {
			return reject(new errors.ErrorMissingParameter('url'));
		}

		if (krist.makeV2Address(privatekey).toLowerCase() !== owner.toLowerCase()) {
			return reject(new errors.ErrorAuthFailed());
		}

		if (!(/^(transaction|block|name)$/gi.exec(event))) {
			return reject(new errors.ErrorInvalidParameter('event'));
		}

		if (method && !(/^(get|post)$/gi.exec(method))) {
			return reject(new errors.ErrorInvalidParameter('method'));
		} else {
			method = method ? method.toLowerCase() : 'get';
		}

		var parsedURL = url.parse(destURL);

		if (parsedURL.hostname === null) {
			return reject(new errors.ErrorInvalidParameter('url'));
		}

		addrs.verify(owner, privatekey).then(function(results) {
			var authed = results.authed;

			if (!authed) {
				return reject(new errors.ErrorAuthFailed());
			}


			switch (event.toLowerCase().trim()) {
				case 'transaction':
					if (addresses && !krist.isValidKristAddressList(addresses)) {
						return reject(new errors.ErrorInvalidParameter('addresses'));
					}

					webhooks.createTransactionWebhook(owner.toLowerCase(), method, destURL, addresses ? addresses.replace(/,+$/, '').toLowerCase() : null).then(resolve).catch(reject);

					break;
				case 'name':
					if (addresses && !krist.isValidKristAddressList(addresses)) {
						return reject(new errors.ErrorInvalidParameter('addresses'));
					}

					webhooks.createNameWebhook(owner.toLowerCase(), method, destURL, addresses ? addresses.replace(/,+$/, '').toLowerCase() : null).then(resolve).catch(reject);

					break;
				case 'block':
					webhooks.createBlockWebhook(owner.toLowerCase(), method, destURL).then(resolve).catch(reject);
					break;
			}
		}).catch(reject);
	});
};

WebhooksController.getWebhooksByAddress = function(privatekey, owner) {
	return new Promise(function(resolve, reject) {
		if (!privatekey) {
			return reject(new errors.ErrorMissingParameter('privatekey'));
		}

		if (!owner) {
			return reject(new errors.ErrorMissingParameter('owner'));
		}

		if (krist.makeV2Address(privatekey).toLowerCase() !== owner.toLowerCase()) {
			return reject(new errors.ErrorAuthFailed());
		}

		addrs.verify(owner, privatekey).then(function(results) {
			var authed = results.authed;

			if (!authed) {
				return reject(new errors.ErrorAuthFailed());
			}

			webhooks.getWebhooksByAddress(owner).then(resolve).catch(reject);
		}).catch(reject);
	});
};

WebhooksController.deleteWebhook = function(privatekey, owner, id) {
	return new Promise(function(resolve, reject) {
		if (!privatekey) {
			return reject(new errors.ErrorMissingParameter('privatekey'));
		}

		if (!owner) {
			return reject(new errors.ErrorMissingParameter('owner'));
		}

		if (!id) {
			return reject(new errors.ErrorMissingParameter('id'));
		}

		if (isNaN(id)) {
			return reject(new errors.ErrorInvalidParameter('id'));
		}

		if (krist.makeV2Address(privatekey).toLowerCase() !== owner.toLowerCase()) {
			return reject(new errors.ErrorAuthFailed());
		}

		addrs.verify(owner, privatekey).then(function(results) {
			var authed = results.authed;

			if (!authed) {
				return reject(new errors.ErrorAuthFailed());
			}

			webhooks.getWebhookById(id).then(function (webhook) {
				if (!webhook || webhook.owner !== owner) {
					return reject(new errors.ErrorWebhookNotFound());
				}

				webhook.destroy().then(resolve).catch(reject);
			}).catch(reject);
		}).catch(reject);
	});
};

WebhooksController.webhookToJSON = function(webhook) {
	if (webhook.event === 'transaction' || webhook.event === 'name') {
		return {
			id: webhook.id,
			owner: webhook.owner,
			event: webhook.event,
			url: webhook.url,
			method: webhook.method,
			addresses: webhook.value ? webhook.value.split(',') : null,
			token: webhook.token
		};
	} else {
		return {
			id: webhook.id,
			owner: webhook.owner,
			event: webhook.event,
			url: webhook.url,
			method: webhook.method,
			token: webhook.token
		};
	}
};

module.exports = WebhooksController;