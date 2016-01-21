var krist       = require('./../src/krist.js'),
	utils       = require('./../src/utils.js'),
	webhooks    = require('./../src/webhooks.js'),
	moment      = require('moment'),
	URL         = require('url-parse');

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
			res.status(400).json({
				ok: false,
				error: 'missing_privatekey'
			});

			return;
		}

		if (!req.body.owner) {
			res.status(400).json({
				ok: false,
				error: 'missing_owner'
			});

			return;
		}

		if (krist.makeV2Address(req.body.privatekey) !== req.body.owner) {
			res.status(403).json({
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

		if (!req.body.method) {
			res.status(400).json({
				ok: false,
				error: 'missing_method'
			});

			return;
		}

		if (!(/(transaction|block)/gi.exec(req.body.event))) {
			res.status(400).json({
				ok: false,
				error: 'invalid_event'
			});

			return;
		}

		if (!(/(get|post)/gi.exec(req.body.method))) {
			res.status(400).json({
				ok: false,
				error: 'invalid_method'
			});

			return;
		}

		var url = new URL(req.body.url);

		if (!url) {
			res.status(400).json({
				ok: false,
				error: 'invalid_url'
			});

			return;
		}

		if (!(/(transaction)/gi.exec(req.body.event))) {
			if (req.body.addresses) {
				if (addressListRegex.exec(req.body.addresses)) {
					webhooks.createTransactionWebhook(req.body.method, req.body.url, req.body.addresses).then(function() {
						res.json({
							ok: true
						});
					}).catch(function() {

					});
				} else {
					res.status(400).json({
						ok: false,
						error: 'invalid_address_list'
					});
				}
			} else {

			}
		} else {

		}

		res.json({
			ok: true
		});
	});

	return app;
};