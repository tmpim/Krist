/*
 * Copyright 2016 - 2022 Drew Edwards, tmpim
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

import { Router } from "express";
import { ErrorInvalidParameter, ErrorMissingParameter } from "../../errors";
import { verifyAddress } from "../../krist/addresses/verify";

export default (): Router => {
  const router = Router();

  /**
	 * @api {post} /login Authenticate an address
	 * @apiName Login
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.7.0
	 *
	 * @apiBody {String} privatekey The privatekey to auth with
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
  router.post("/login", async (req, res) => {
    if (!req.body.privatekey) throw new ErrorMissingParameter("privatekey");

    // 2021: v1 addresses have been removed
    if (req.query.v === "1") throw new ErrorInvalidParameter("v");

    const results = await verifyAddress(req, req.body.privatekey);

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

  return router;
};
