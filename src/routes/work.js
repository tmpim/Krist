/**
 * Created by Drew Lemmy, 2016-2021
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
 * For more project information, see <https://github.com/tmpim/krist>.
 */

const krist = require("./../krist.js");

module.exports = function(app) {
  app.get("/", async function(req, res, next) {
    if (typeof req.query.getwork !== "undefined") {
      return res.send((await krist.getWork()).toString());
    }

    next();
  });

  /**
	 * @api {get} /work Get the current work
	 * @apiName GetWork
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.5
	 *
	 * @apiSuccess {Number} work The current Krist work (difficulty)
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "work": 18750
     * }
	 */
  app.get("/work", async function(req, res) {
    res.json({
      ok: true,
      work: await krist.getWork()
    });
  });

  /**
	 * @api {get} /work/day Get the work over the past 24 hours
	 * @apiName GetWorkDay
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.5
	 *
	 * @apiSuccess {Number[]} work The work every minute for the past 24 hours, starting with 24 hours ago.
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "work": [18750, 19250, ...]
     * }
	 */
  app.get("/work/day", async function(req, res) {
    res.json({
      ok: true,
      work: await krist.getWorkOverTime()
    });
  });

  return app;
};
