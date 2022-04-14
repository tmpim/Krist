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

import { LookupQuery, TRANSACTION_FIELDS } from ".";

import { transactionToJson } from "../../../krist/transactions";
import { lookupTransactions } from "../../../krist/transactions/lookup";

import {
  validateLimit, validateOffset, validateOrderBy, validateOrder,
  validateAddressList
} from "./utils";

export default (): Router => {
  const router = Router();

  /**
   * @api {get} /lookup/transactions/:addresses? Lookup transactions
   * @apiName LookupTransactions
   * @apiGroup LookupGroup
   * @apiVersion 2.3.0
   *
   * @apiDescription Return all the transactions to/from the given address(es),
   *   or the whole network if no addresses are specified.
   *
   * **WARNING:** The Lookup API is in Beta, and is subject to change at any
   * time without warning.
   *
	 * @apiParam (URLParameter) {String[]} [addresses] A comma-separated list of
   *           addresses to filter transactions to/from.
   *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of
   *           results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the
   *           results.
	 * @apiParam (QueryParameter) {String} [orderBy=id] The field to order the
   *           results by. Must be one of `id`, `from`, `to`, `value`, `time`,
   *           `sent_name` or `sent_metaname`.
	 * @apiParam (QueryParameter) {String} [order=ASC] The direction to order
   *           the results in. Must be one of `ASC` or `DESC`.
	 * @apiParam (QueryParameter) {Boolean} [includeMined] If supplied,
   *           transactions from mining will be included.
   *
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   * @apiUse Transactions
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "count": 20,
   *   "total": 4785,
   *   "transactions": [
   *     {
   *       "id": 892595,
   *       "from": "khugepoopy",
   *       "to": "kqxhx5yn9v",
   *       "value": 7000,
   *       "time": "2018-12-29T13:02:05.000Z",
   *       "name": null,
   *       "metadata": "lignum@switchcraft.kst",
   *       "type": "transfer"
   *     },
   *     {
   *       "id": 1454706,
   *       "from": "k5cfswitch",
   *       "to": "khugepoopy",
   *       "value": 5050,
   *       "time": "2020-01-20T00:01:47.000Z",
   *       "name": null,
   *       "metadata": "",
   *       "type": "transfer"
   *     },
   *     ...
   */
  router.get("/transactions/:addresses?", async (req: LookupQuery<{
    includeMined?: string;
  }>, res) => {
    const { addresses: addressesParam } = req.params;

    // Validate address list
    const addressList = addressesParam
      ? validateAddressList(addressesParam) : undefined;

    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(TRANSACTION_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);
    const includeMined = req.query.includeMined !== undefined;

    // Perform the query
    // NOTE: `time` is replaced with `id` as `time` is typically not indexed.
    //       While transactions are not _guaranteed_ to be monotonic, they
    //       generally are, so this is a worthwhile performance tradeoff.
    const { rows, count } = await lookupTransactions(
      addressList,
      limit,
      offset,
      orderBy === "time" ? "id" : orderBy,
      order,
      includeMined
    );

    return res.json({
      ok: true,
      count: rows.length,
      total: count,
      transactions: rows.map(transactionToJson)
    });
  });

  return router;
};
