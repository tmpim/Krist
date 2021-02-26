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

const krist     = require("./../krist.js");
const utils     = require("./../utils.js");
const addresses = require("./../addresses.js");
const errors    = require("./../errors/errors.js");

module.exports = function(app) {
  /**
	 * @api {post} /login Authenticate an address
	 * @apiName Login
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.7.0
	 *
	 * @apiSuccess {Number} privatekey The privatekey to auth with
	 *
	 * @apiSuccessExample {json} Success, Authed
	 * {
	 *     "ok": true,
	 *     "authed": true,
	 *     "address": "kre3w0i79j"
   * }
	 *
	 * @apiSuccessExample {json} Success, Auth Failed
	 * {
	 *     "ok": true,
	 *     "authed": false
   * }
	 */
  app.post("/login", async function(req, res) {
    try {
      if (!req.body.privatekey) throw new errors.ErrorMissingParameter("privatekey");

      // 2021: v1 addresses have been removed
      if (req.query.v === "1") throw new errors.ErrorInvalidParameter("v");

      const address = krist.makeV2Address(req.body.privatekey);
      const results = await addresses.verify(req, address, req.body.privatekey);

      if (results.authed) {
        return res.json({
          ok: true,
          authed: true,
          address: results.address.address
        });
      } else {
        return res.json({
          ok: true,
          authed: false
        });
      }
    } catch (err) {
      return utils.sendErrorToRes(req, res, err);
    }
  });

  return app;
};
