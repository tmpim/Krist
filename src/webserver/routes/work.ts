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

import { getLastBlock } from "../../krist/blocks";
import { getDetailedUnpaid, getUnpaidNameCount } from "../../krist/names";
import { getWork, getWorkOverTime } from "../../krist/work";

import { ErrorBlockNotFound } from "../../errors";
import { getBaseBlockValue } from "../../utils";

export default (): Router => {
  const router = Router();

  // ===========================================================================
  // API v2
  // ===========================================================================
  /**
   * @api {get} /work Get the current work
   * @apiName GetWork
   * @apiGroup MiscellaneousGroup
   * @apiVersion 2.0.5
   *
   * @apiSuccess {Number} work The current Krist work (difficulty).
   *
   * @apiSuccessExample {json} Success
   * {
   *     "ok": true,
   *     "work": 18750
   * }
   */
  router.get("/work", async (req, res) => {
    res.json({
      ok: true,
      work: await getWork()
    });
  });

  /**
   * @api {get} /work/day Get the work over the past 24 hours
   * @apiName GetWorkDay
   * @apiGroup MiscellaneousGroup
   * @apiVersion 2.0.5
   *
   * @apiSuccess {Number[]} work The work every minute for the past 24 hours,
   *   starting with 24 hours ago.
   *
   * @apiSuccessExample {json} Success
   * {
   *     "ok": true,
   *     "work": [18750, 19250, ...]
   * }
   */
  router.get("/work/day", async (req, res) => {
    res.json({
      ok: true,
      work: await getWorkOverTime()
    });
  });

  /**
   * @api {get} /work/detailed Get detailed work and block value information
   * @apiName GetWorkDetailed
   * @apiGroup MiscellaneousGroup
   * @apiVersion 2.6.0
   *
   * @apiSuccess {Number} work The current Krist work (difficulty).
   * @apiSuccess {Number} unpaid The current number of unpaid names.
   *
   * @apiSuccess {Number} base_value The base block value.
   * @apiSuccess {Number} block_value The current block value (base + unpaid).
   *
   * @apiSuccess {Object} decrease Information about the next block value
   *   decrease.
   * @apiSuccess {Number} decrease[value] How much Krist the block value will
   *   decrease by when the next name(s) expire.
   * @apiSuccess {Number} decrease[blocks] How many blocks before the next block
   *   value decrease.
   * @apiSuccess {Number} decrease[reset] How many blocks before the block value
   *   will completely reset to the base value.
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "work": 92861,
   *   "unpaid": 3,
   *   "base_value": 1,
   *   "block_value": 4,
   *   "decrease": {
   *     "value": 2,
   *     "blocks": 496,
   *     "reset": 500
   *   }
   * }
   */
  router.get("/work/detailed", async (req, res) => {
    const lastBlock = await getLastBlock();
    if (!lastBlock) throw new ErrorBlockNotFound();

    const unpaidNames = await getUnpaidNameCount();
    const baseValue = getBaseBlockValue(lastBlock.id);

    const detailedUnpaid = await getDetailedUnpaid();
    const nextUnpaid = detailedUnpaid.find(u => u.unpaid > 0);
    const mostUnpaid = [...(detailedUnpaid.filter(u => u.unpaid > 0))];
    mostUnpaid.sort((a, b) => b.unpaid - a.unpaid);

    res.json({
      ok: true,

      work: await getWork(),
      unpaid: unpaidNames,

      base_value: baseValue,
      block_value: baseValue + unpaidNames,

      decrease: {
        value: nextUnpaid ? nextUnpaid.count : 0,
        blocks: nextUnpaid ? nextUnpaid.unpaid : 0,
        reset: mostUnpaid && mostUnpaid.length > 0 ? mostUnpaid[0].unpaid : 0
      }
    });
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req, res, next) => {
    if (req.query.getwork !== undefined) {
      return res.send((await getWork()).toString());
    }

    next();
  });

  return router;
};
