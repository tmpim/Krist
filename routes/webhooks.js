var krist               = require('./../src/krist.js'),
	utils               = require('./../src/utils.js'),
	webhooks            = require('./../src/webhooks.js'),
	webhooksController  = require('./../src/controllers/webhooks.js'),
	moment              = require('moment'),
	url                 = require('url');

module.exports = function(app) {
	app.post('/webhook', function(req, res) {
		webhooksController.registerWebhook(req.body.privatekey, req.body.owner, req.body.event, req.body.url, req.body.method, req.body.addresses).then(function(webhook) {
			res.json({
				ok: true,
				webhook: webhooksController.webhookToJSON(webhook)
			});
		}).catch(function(error) {
			utils.sendError(res, error);
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

		webhooks.getWebhooksByOwner(req.params.owner).then(function(results) {
			var out = [];

			results.forEach(function (webhook) {
			});

			res.json({
				ok: true,
				count: out.length,
				webhooks: out
			});
		});
	});

	function deleteWebhook(req, res) {
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

		webhooks.getWebhookById(Math.max(parseInt(req.params.id), 0)).then(function(webhook) {
			if (!webhook) {
				res.status(404).json({
					ok: false,
					error: 'not_found'
				});

				return;
			}

			if (webhook.owner !== req.body.owner) {
				res.status(404).json({
					ok: false,
					error: 'not_found'
				});

				return;
			}

			webhook.destroy().then(function () {
				res.json({
					ok: true
				});
			});
		});
	}

	app.post('/webhook/:id/delete', deleteWebhook);
	app.delete('/webhook/:id', deleteWebhook);

	return app;
};