var webhooks    = require('./../webhooks.js'),
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

		webhooks.isURLAllowed(parsedURL).then(function (allowed) {
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
}

WebhooksController.webhookToJSON = function(webhook) {
	if (webhook.event === 'transaction' || webhook.event === 'name') {
		return {
			id: webhook.id,
			event: webhook.event,
			addresses: webhook.value.split(','),
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