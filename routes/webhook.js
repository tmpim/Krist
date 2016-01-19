var krist   = require('./../src/krist.js'),
	utils   = require('./../src/utils.js'),
	moment  = require('moment');

module.exports = function(app) {
	app.post('/webhook', function(req, res) {
		if (!req.query.type) {
			res.sendStatus(400).json({
				ok: false,
				error: 'missing_type'
			});

			return;
		}

		if (!req.query.value) {
			res.sendStatus(400).json({
				ok: false,
				error: 'missing_value'
			});

			return;
		}

		if (!req.query.url) {
			res.sendStatus(400).json({
				ok: false,
				error: 'missing_url'
			});

			return;
		}

		if (req.query.type !== 'transaction' || req.query.type !== 'block') {
			res.sendStatus(400).json({
				ok: false,
				error: 'invalid_type'
			});

			return;
		}
	});

	return app;
}