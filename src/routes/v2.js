var krist   = require('./../krist.js'),
	utils   = require('./../utils.js'),
	errors  = require('./../errors/errors.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (req.query.v2) {
			return res.send(krist.makeV2Address(req.query.v2));
		}

		next();
	});

	app.post('/v2', function(req, res) {
		if (!req.body.privatekey) {
			return utils.sendError(res, new errors.ErrorMissingParameter('privatekey'));
		}

		res.json({
			ok: true,
			address: krist.makeV2Address(req.body.privatekey)
		});
	});

	return app;
};