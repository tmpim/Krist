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
import { WALLET_VERSION } from "../../utils/vars.js";

export default (): Router => {
  const router = Router();

  // ===========================================================================
  // API v2
  // ===========================================================================
  /**
	 * @api {get} /walletversion Get latest KristWallet version
	 * @apiName GetWalletVersion
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {Number} walletVersion The latest KristWallet version.
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "walletVersion": 14
   * }
	 */
  router.get("/walletversion", (req, res) => {
    res.json({
      ok: true,
      walletVersion: WALLET_VERSION
    });
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", (req, res, next) => {
    if (req.query.getwalletversion !== undefined) {
      return res.send(WALLET_VERSION.toString());
    }

    next();
  });

  return router;
};
