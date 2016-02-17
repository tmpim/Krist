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

var krist   = require('./../krist.js'),
	fs      = require('fs'),
	moment  = require('moment');

module.exports = function(app) {
	/**
	 * @api {get} /motd Get the message of the day
	 * @apiName GetMOTD
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {String} motd The message of the day
	 * @apiSuccess {String} psa A public service announcement if there is one
	 * @apiSuccess {String} schrodingers_cat The current observed state of Schrödinger's cat
	 * @apiSuccess {Date} set The date the MOTD was last changed
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "motd": "Welcome to Krist!",
	 *     "psa": "child abuse is bad!!",
	 *     "schrodingers_cat": "dead",
	 *     "set": "2016-01-24T15:56:19.231Z"
	 * }
	 */
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
