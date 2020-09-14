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

const krist = require("./../krist.js");

module.exports = function(app) {
  /**
	 * @api {get} /motd Get the message of the day
	 * @apiName GetMOTD
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {String} motd The message of the day
	 * @apiSuccess {Date} set The date the MOTD was last changed
	 * @apiSuccess {Boolean} debug_mode If the server is running in debug mode,
   *                       this will be set to 'true'.
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "motd": "Welcome to Krist!",
	 *     "set": "2016-01-24T15:56:19.231Z"
	 * }
	 */
  app.all("/motd", async function(req, res) {
    const { motd, motd_set, debug_mode } = await krist.getMOTD();

    return res.json({
      ok: true,
      motd,
      set: motd_set,
      debug_mode
    });
  });

  return app;
};
