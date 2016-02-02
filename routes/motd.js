var krist   = require('./../src/krist.js'),
	fs      = require('fs'),
	moment  = require('moment');

module.exports = function(app) {
	app.all('/motd', function(req, res) {
		fs.readFile('motd.txt', function(err, data) {
			if (err) {
				return res.json({
					ok: true,
					motd: 'Welcome to Krist!'
				});
			}

			fs.stat('motd.txt', function(err, stats) {
				if (err) {
					return res.json({
						ok: true,
						motd: data.toString()
					});
				}

				res.json({
					ok: true,
					motd: data.toString(),
					psa: "child abuse is bad!!",
					schrodingers_cat: Math.round(Math.random()) == 1 ? "alive" : "dead",
					set: stats.mtime
				});
			});
		});
	});

	return app;
};
