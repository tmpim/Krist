/*
 * Copyright 2016 - 2024 Drew Edwards, tmpim
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
import { ErrorInvalidParameter, ErrorMissingParameter } from "../../errors/index.js";
import { makeV2Address } from "../../utils/index.js";
import { ReqQuery } from "../index.js";

export default (): Router => {
  const router = Router();

  // ===========================================================================
  // API v2
  // ===========================================================================
  /**
	 * @api {post} /v2 Get v2 address from a private key
	 * @apiName MakeV2Address
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiBody {String} privatekey The private key to turn into
	 *   an address
	 *
	 * @apiSuccess {String} address The address from the private key
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "address": "kre3w0i79j"
     * }
	 */
  router.post("/v2", (req, res) => {
    if (!req.body.privatekey) throw new ErrorMissingParameter("privatekey");
    if (typeof req.body.privatekey !== "string")
      throw new ErrorInvalidParameter("privatekey");

    res.json({
      ok: true,
      address: makeV2Address(req.body.privatekey)
    });
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", (req: ReqQuery<{
    v2?: string;
  }>, res, next) => {
    if (req.query.v2) {
      return res.send(makeV2Address(req.query.v2));
    }

    next();
  });

  return router;
};
