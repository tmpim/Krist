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
  router.get("/work", async (req, res) => {
    res.json({
      ok: true,
      work: await getWork()
    });
  });

  router.get("/work/day", async (req, res) => {
    res.json({
      ok: true,
      work: await getWorkOverTime()
    });
  });

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
