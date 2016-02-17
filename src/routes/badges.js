/**
 * Created by Drew Lemmy, 2016
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

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