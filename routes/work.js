var krist = require('./../src/krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.getwork !== 'undefined') {
			res.send(krist.getWork().toString());
			return;
		}

		next();
	});

	app.get('/work', function(req, res) {
		res.header('Content-Type', 'application/json');

		res.json({
			ok: true,
			work: krist.getWork()
		});
	});

	return app;
};