var krist = require('./../src/krist.js'),
	utils = require('./../src/utils.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (req.query.v2) {
			res.send(krist.makeV2Address(req.query.v2));
			return;
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
}