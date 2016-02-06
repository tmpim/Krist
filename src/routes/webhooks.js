var krist               = require('./../krist.js'),
	utils               = require('./../utils.js'),
	webhooks            = require('./../webhooks.js'),
	webhooksController  = require('./../controllers/webhooks.js');

module.exports = function(app) {
	app.post('/webhooks', function(req, res) {
		webhooksController.registerWebhook(req.body.privatekey, req.body.owner, req.body.event, req.body.url, req.body.method, req.body.addresses).then(function(webhook) {
			res.json({
				ok: true,
				webhook: webhooksController.webhookToJSON(webhook)
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	function getWebhooksByOwner(req, res) {
		webhooksController.getWebhooksByAddress(req.body.privatekey, req.params.owner).then(function(results) {
			var out = [];

			results.forEach(function(webhook) {
				out.push(webhooksController.webhookToJSON(webhook));
			});

			res.json({
				ok: true,
				count: out.length,
				webhooks: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	}

	app.post('/webhooks/:owner', getWebhooksByOwner);
	app.post('/address/:owner/webhooks', getWebhooksByOwner);

	function deleteWebhook(req, res) {
		webhooksController.deleteWebhook(req.body.privatekey, req.body.owner, req.params.id).then(function() {
			res.json({
				ok: true
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	}

	app.post('/webhooks/:id/delete', deleteWebhook);
	app.delete('/webhooks/:id', deleteWebhook);

	return app;
};