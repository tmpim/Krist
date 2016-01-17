var krist = require('./../src/krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.dumpnames !== 'undefined') {
			krist.getNames().then(function(names) {
				var out = "";

				names.forEach(function(name) {
					out += name.name + ";";
				});

				res.send(out);
			});

			return;
		}

		next();
	});

	app.get('/name', function(req, res) {
		if ((req.query.limit && isNaN(req.query.limit) || req.query.limit &&  req.query.limit <= 0)) {
			res.status(400).json({
				ok: false,
				error: 'invalid_limit'
			});

			return;
		}

		if ((req.query.offset && isNaN(req.query.offset) || req.query.offset &&  req.query.offset <= 0)) {
			res.status(400).json({
				ok: false,
				error: 'invalid_offset'
			});

			return;
		}

		krist.getNames(req.query.limit, req.query.offset).then(function(names) {
			var out = [];

			names.forEach(function(name) {
				out.push({
					name: name.name,
					owner: name.owner,
					registered: name.registered,
					updated: name.updated,
					a: name.a,
				});
			});

			res.json({
				ok: true,
				names: out
			});
		});
	});

	return app;
}