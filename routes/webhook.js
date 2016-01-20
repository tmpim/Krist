var krist       = require('./../src/krist.js'),
	utils       = require('./../src/utils.js'),
	webhooks    = require('./../src/webhooks.js'),
	moment      = require('moment'),
	URL         = require('url-parse');

module.exports = function(app) {
	app.post('/webhook', function(req, res) {
		// the :nail-care: of webhooks

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

		res.json({
			ok: true
		});
	});

	return app;
}