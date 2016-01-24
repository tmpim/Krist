var krist   = require('./../src/krist.js'),
	fs      = require('fs');

module.exports = function(app) {
	app.all('/motd', function(req, res) {
		fs.readFile('motd.txt', function(err, data) {
			if (err) {
				res.json({
					ok: true,
					motd: 'Welcome to Krist!'
				});

				return;
			}

			res.json({
				ok: true,
				motd: data.toString()
			});
		});
	});

	return app;
};