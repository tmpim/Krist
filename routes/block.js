var krist = require('./../src/krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.lastblock !== 'undefined') {
			krist.getLastBlock().then(function(block) {
				res.send(block.hash.substring(0, 12));
			});

			return;
		}

		next();
	});

	app.get('/block', function(req, res) {
		krist.getLastBlock().then(function(block) {
			res.json({
				ok: true,
				hash: block.hash,
				short_hash: block.hash.substring(0, 12),
				value: block.value,
				time: block.time
			});
		});
	});

	return app;
}