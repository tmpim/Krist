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

import { getKristSupply } from "../../krist/supply";

export default (): Router => {
  const router = Router();

  // ===========================================================================
  // API v2
  // ===========================================================================
  /**
	 * @api {get} /supply Get the money supply
	 * @apiName GetMoneySupply
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Returns the amount of Krist currently in circulation.
	 *
	 * @apiSuccess {Number} money_supply The amount of Krist in circulation.
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "money_supply": 1013359534
   * }
	 */
  router.get("/supply", async (req, res) => {
    const supply = await getKristSupply();

    res.json({
      ok: true,
      money_supply: supply
    });
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req, res, next) => {
    if (req.query.getmoneysupply !== undefined) {
      res.send((await getKristSupply()).toString());
      return;
    }

    next();
  });

  return router;
};
