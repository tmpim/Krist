var config  = require('./../config.js'),
	shields = require('shields-lightweight');

module.exports = function(app) {
	app.get('/badge/:server', function(req, res) {
		var style = req.params.style ? req.params.style.toLowerCase() : 'flat';

		if (!/^(plastic|flat|flat\-squared|social)$/i.test(style)) {
			res.status(400).send("Invalid style.");

			return;
		}

		if (config.badge_verifiedServers.indexOf(req.params.server) > -1) {
			res.header("Content-Type", "image/svg+xml");

			var shield = shields.svg(config.badge_labelLeft, config.badge_labelRight, config.badge_colour, style);

			res.send(shield);
		} else {
			res.status(403).send("Server not verified.");
		}
	});

	return app;
}