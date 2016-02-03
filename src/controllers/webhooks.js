var webhooks    = require('./../webhooks.js'),
	names       = require('./../names.js'),
	errors      = require('./../errors/errors.js'),
	krist       = require('./../krist.js'),
	url         = require('url');

function WebhooksController() {}

WebhooksController.registerWebhook = function(privatekey, owner, event, destURL, method, addresses) {
	return new Promise(function(resolve, reject) {
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

		names.getNameCountByAddress(owner).then(function(nameCount) {
			webhooks.getWebhookCountByAddress(owner).then(function(webhookCount) {
				if (webhookCount >= nameCount) {
					return reject(new errors.ErrorLimitReached());
				}

				webhooks.isURLAllowed(parsedURL).then(function(allowed) {
					if (!allowed) {
						return reject(new errors.ErrorLimitReached());
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
				});
			});
		});
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

		webhooks.getWebhooksByAddress(owner).then(resolve).catch(reject);
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

		webhooks.getWebhookById(id).then(function(webhook) {
			if (!webhook || webhook.owner !== owner) {
				return reject(new errors.ErrorWebhookNotFound());
			}

			webhook.destroy().then(resolve).catch(reject);
		}).catch(reject);
	});
};

WebhooksController.webhookToJSON = function(webhook) {
	if (webhook.event === 'transaction' || webhook.event === 'name') {
		return {
			id: webhook.id,
			event: webhook.event,
			addresses: webhook.value ? webhook.value.split(',') : null,
			url: webhook.url,
			method: webhook.method,
			owner: webhook.owner
		};
	} else {
		return {
			id: webhook.id,
			event: webhook.event,
			url: webhook.url,
			method: webhook.method,
			owner: webhook.owner
		};
	}
};

module.exports = WebhooksController;