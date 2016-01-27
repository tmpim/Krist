var krist   = require('./../src/krist.js'),
	fs      = require('fs'),
	moment  = require('moment');

module.exports = function(app) {
	app.all('/motd', function(req, res) {
		fs.readFile('motd.txt', function(err, data) {
			if (err) {
				res.json({
					ok: true,
					motd: 'Welcome to Krist!',
					psa: "child abuse is bad!!",
					schrodingers_cat: Math.round(Math.random()) == 1 ? "alive" : "dead"
				});

				return;
			}

			fs.stat('motd.txt', function(err, stats) {
				if (err) {
					res.json({
						ok: true,
						motd: data.toString()
					});

					return;
				}

				res.json({
					ok: true,
					motd: data.toString(),
					set: moment(stats.mtime).format('YYYY-MM-DD HH:mm:ss').toString(),
					set_unix: moment(stats.mtime).unix(),
					psa: "child abuse is bad!!",
					schrodingers_cat: Math.round(Math.random()) == 1 ? "alive" : "dead"
				});
			});
		});
	});

	return app;
};
