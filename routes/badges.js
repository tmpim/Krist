var config  = require('./../config.js'),
	utils   = require('./../src/utils.js'),
	errors  = require('./../src/errors/errors.js'),
	shields = require('shields-lightweight');

module.exports = function(app) {
	app.get('/badge/:server', function(req, res) {
		var style = req.query.style ? req.query.style.toLowerCase() : 'flat';

		if (!/^(plastic|flat|flat\-squared|social)$/i.test(style)) {
			utils.sendError(res, new errors.ErrorInvalidParameter('style'));

			return;
		}

		if (config.badge_verifiedServers.indexOf(req.params.server) > -1) {
			res.header("Content-Type", "image/svg+xml");

			var shield = shields.svg(config.badge_labelLeft, config.badge_labelRight, config.badge_colour, style);

			res.send(shield);
		} else {
			utils.sendError(res, new errors.ErrorServerNotVerified());
		}
	});

	return app;
}