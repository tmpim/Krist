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
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number=1,2} [v] The address version
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
    if (!req.body.privatekey)
      return utils.sendErrorToRes(req, res, new errors.ErrorMissingParameter("privatekey"));

    const v = parseInt(req.query.v) || 2;
    let address;

    switch (v) {
    case 1:
      address = utils.sha256(req.body.privatekey).substr(0, 10);
      break;
    case 2:
      address = krist.makeV2Address(req.body.privatekey);
      break;
    default:
      return utils.sendErrorToRes(req, res, new errors.ErrorInvalidParameter("v"));
    }

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
  });

  return app;
};
