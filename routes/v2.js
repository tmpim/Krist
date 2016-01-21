var krist = require('./../src/krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (req.query.v2) {
			res.send(krist.makeV2Address(req.query.v2));
			return;
		}

		next();
	});

	app.all('/v2/:key', function(req, res) {
		res.header('Content-Type', 'application/json');

		res.json({
			ok: true,
			address: krist.makeV2Address(req.params.key)
		});
	});

	return app;
}