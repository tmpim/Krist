var krist   = require('./../src/krist.js'),
	fs      = require('fs'),
	moment  = require('moment');

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
					set_unix: moment(stats.mtime).unix()
				});
			});
		});
	});

	return app;
};