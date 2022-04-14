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

import { BLOCK_FIELDS, LookupQuery } from ".";

import { blockToJson } from "../../../krist/blocks";
import { lookupBlocks } from "../../../krist/blocks/lookup";

import {
  validateLimit, validateOffset, validateOrderBy, validateOrder
} from "./utils";

export default (): Router => {
  const router = Router();

  /**
   * @api {get} /lookup/blocks Lookup blocks
   * @apiName LookupBlocks
   * @apiGroup LookupGroup
   * @apiVersion 2.1.3
   *
   * @apiDescription Return all the blocks.
   *
   * **WARNING:** The Lookup API is in Beta, and is subject to change at any
   * time without warning.
   *
	 * @apiUse LimitOffset
	 * @apiQuery {String} [orderBy=height] The field to order the
   *           results by. Must be one of `height`, `address`, `hash`, `value`,
   *           `time` or `difficulty`.
	 * @apiQuery {String} [order=ASC] The direction to order
   *           the results in. Must be one of `ASC` or `DESC`.
   *
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   * @apiUse Blocks
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "count": 20,
   *   "total": 1397410,
   *   "blocks": [
   *     {
   *       "height": 101496,
   *       "address": "k5ztameslf",
   *       "hash": "00000000224f08def4a2cef05fed91abdf8eb03feb79d80fe2b187487d2ad06b",
   *       "short_hash": "00000000224f",
   *       "value": 3013,
   *       "time": "2016-01-11T22:16:09.000Z",
   *       "difficulty": 18758
   *     },
   *     {
   *       "height": 1187992,
   *       "address": "kristallie",
   *       "hash": "00000000004fd4ededc6edc7528c99f10e74cdecd88627a5a98df9431f52473b",
   *       "short_hash": "00000000004f",
   *       "value": 152,
   *       "time": "2020-02-09T04:02:58.000Z",
   *       "difficulty": 100
   *     },
   *     ...
   */
  router.get("/blocks", async (req: LookupQuery, res) => {
    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(BLOCK_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);

    // Perform the query
    // NOTE: `height` is replaced with `id` to maintain compatibility with what
    //       the API typically returns for block objects.
    // NOTE: `time` is replaced with `id` as `time` is typically not indexed.
    //       While blocks are not _guaranteed_ to be monotonic, they generally
    //       are, so this is a worthwhile performance tradeoff.
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
