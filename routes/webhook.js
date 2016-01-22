var krist       = require('./../src/krist.js'),
	utils       = require('./../src/utils.js'),
	webhooks    = require('./../src/webhooks.js'),
	moment      = require('moment'),
	url         = require('url');

var addressListRegex = /^(?:k[a-z0-9]{9}|[a-f0-9]{10})(?:,(?:k[a-z0-9]{9}|[a-f0-9]{10})*)*$/i; // regex is intense

/*
	here's a rundown of what that does
	- ensures the string is a comma delimited list of ADDRESSES
	- an address can either be formated as follows:
	-- k followed by 9 alphanumeric characters
	-- 10 hexadecimal characters
 */

module.exports = function(app) {
	app.post('/webhook', function(req, res) {
		// the :nail_care: of webhooks

		if (!req.body.privatekey) {
			res.status(401).json({
				ok: false,
				error: 'missing_privatekey'
			});

			return;
		}

		if (!req.body.owner) {
			res.status(401).json({
				ok: false,
				error: 'missing_owner'
			});

			return;
		}

		if (krist.makeV2Address(req.body.privatekey) !== req.body.owner) {
			res.status(401).json({
				ok: false,
				error: 'auth_failed'
			});

			return;
		}

		if (!req.body.event) {
			res.status(400).json({
				ok: false,
				error: 'missing_event'
			});

			return;
		}

		if (!req.body.url) {
			res.status(400).json({
				ok: false,
				error: 'missing_url'
			});

			return;
		}

		if (!(/^(transaction|block)/gi.exec(req.body.event))) {
			res.status(400).json({
				ok: false,
				error: 'invalid_event'
			});

			return;
		}

		var method = 'get';

		if (req.body.method) {
			if (!(/^(get|post)/gi.exec(req.body.method))) {
				res.status(400).json({
					ok: false,
					error: 'invalid_method'
				});

				return;
			} else {
				method = req.body.method.toLowerCase();
			}
		}

		var parsedURL = url.parse(req.body.url);

		if (parsedURL.hostname === null) {
			res.status(400).json({
				ok: false,
				error: 'invalid_url'
			});

			return;
		}

		webhooks.isURLAllowed(parsedURL).then(function (allowed) {
			if (!allowed) {
				res.status(403).json({
					ok: false,
					error: 'limit_reached'
				});

				return;
			}

			switch(req.body.event.toLowerCase().trim()) {
				case 'transaction':
					if (req.body.addresses) {
						if (addressListRegex.exec(req.body.addresses)) {
							webhooks.createTransactionWebhook(req.body.owner.toLowerCase(), method, req.body.url, req.body.addresses.replace(/,+$/, '')).then(function(webhook) {
								res.json({
									ok: true,
									id: webhook.id
								});
							}).catch(function(error) {
								res.status(500).json({
									ok: false,
									error: 'server_error'
								});

								console.error('[Client Error]'.red + ' Error creating transaction webhook with addresses');
								console.error(error);
							});
						} else {
							res.status(400).json({
								ok: false,
								error: 'invalid_address_list'
							});
						}
					} else {
						webhooks.createTransactionWebhook(req.body.owner.toLowerCase(), method, req.body.url, null).then(function(webhook) {
							res.json({
								ok: true,
								id: webhook.id
							});
						}).catch(function(error) {
							res.status(500).json({
								ok: false,
								error: 'server_error'
							});

							console.error('[Client Error]'.red + ' Error creating transaction webhook without addresses');
							console.error(error);
						});
					}
					break;

				case 'block':
					webhooks.createBlockWebhook(req.body.owner.toLowerCase(), method, req.body.url).then(function(webhook) {
						res.json({
							ok: true,
							id: webhook.id
						});
					}).catch(function(error) {
						res.status(500).json({
							ok: false,
							error: 'server_error'
						});

						console.error('[Client Error]'.red + ' Error creating block webhook');
						console.error(error);
					});
					break;

				default:
					res.status(400).json({
						ok: false,
						error: 'invalid_event'
					});

					console.error('Lem is super stupid'.red + ' ' + req.body.event);

					break;
			}
		});
	});

	app.post('/webhooks/:owner', function(req, res) {
		if (!req.body.privatekey) {
			res.status(401).json({
				ok: false,
				error: 'missing_privatekey'
			});

			return;
		}

		if (krist.makeV2Address(req.body.privatekey) !== req.params.owner) {
			res.status(401).json({
				ok: false,
				error: 'auth_failed'
			});

			return;
		}

		webhooks.getWebhooksByOwner(req.params.owner).then(function(weebhooks) {
			var out = [];

			weebhooks.forEach(function (webhook) {
				if (webhook.event === 'transaction') {
					out.push({
						id: webhook.id,
						event: webhook.event,
						addresses: webhook.value,
						url: webhook.url,
						method: webhook.method,
						owner: webhook.owner
					});
				} else {
					out.push({
						id: webhook.id,
						event: webhook.event,
						url: webhook.url,
						method: webhook.method,
						owner: webhook.owner
					});
				}
			});

			res.json({
				ok: true,
				count: out.length,
				webhooks: out
			});
		});
	});

	return app;
};