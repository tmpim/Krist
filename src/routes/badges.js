var config  = require('./../../config.js'),
	utils   = require('./../utils.js'),
	errors  = require('./../errors/errors.js'),
	shields = require('shields-lightweight');

module.exports = function(app) {
	app.get('/badge/:server', function(req, res) {
		var style = req.query.style ? req.query.style.toLowerCase() : 'flat';

		if (!/^(plastic|flat|flat\-squared|social)$/i.test(style)) {
			return utils.sendErrorToRes(req, res, new errors.ErrorInvalidParameter('style'));
		}

		if (config.badgeVerifiedServers.indexOf(req.params.server) > -1) {
			res.header("Content-Type", "image/svg+xml");

			var shield = shields.svg(config.badgeLabelLeft, config.badgeLabelRight, config.badgeColour, style);

			res.send(shield);
		} else {
			utils.sendErrorToRes(req, res, new errors.ErrorServerNotVerified());
		}
	});

	return app;
};