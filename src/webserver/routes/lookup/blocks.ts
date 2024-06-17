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
import { blockToJson } from "../../../krist/blocks/index.js";
import { lookupBlocks } from "../../../krist/blocks/lookup.js";
import { BLOCK_FIELDS, LookupQuery } from "./index.js";
import { validateLimit, validateOffset, validateOrder, validateOrderBy } from "./utils.js";

export default (): Router => {
  const router = Router();

  router.get("/blocks", async (req: LookupQuery, res) => {
    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(BLOCK_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);

    // Perform the query
    // NOTE: `height` is replaced with `id` to maintain compatibility with what the API typically returns for block
    //   objects.
    // NOTE: `time` is replaced with `id` as `time` is typically not indexed. While blocks are not _guaranteed_ to be
    //   monotonic, they generally are, so this is a worthwhile performance tradeoff.
    const { rows, count } = await lookupBlocks(
      limit,
      offset,
      orderBy === "height"
        ? "id"
        : (orderBy === "time" ? "id" : orderBy),
      order
    );

    return res.json({
      ok: true,
      count: rows.length,
      total: count,
      blocks: rows.map(blockToJson)
    });
  });

  return router;
};
