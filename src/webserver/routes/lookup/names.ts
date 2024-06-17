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
import { nameToJson } from "../../../krist/names/index.js";
import { lookupNames } from "../../../krist/names/lookup.js";
import { transactionToJson } from "../../../krist/transactions/index.js";
import { lookupNameHistory, lookupTransactionsToName } from "../../../krist/transactions/lookup.js";
import { LookupQuery, NAME_FIELDS, TRANSACTION_FIELDS } from "./index.js";
import { validateAddressList, validateLimit, validateOffset, validateOrder, validateOrderBy } from "./utils.js";

export default (): Router => {
  const router = Router();

  /**
   * @api {get} /lookup/names/:addresses Lookup names
   * @apiName LookupNames
   * @apiGroup LookupGroup
   * @apiVersion 2.1.3
   *
   * @apiDescription Return all the names owned by the given address(es), or the whole network if no addresses are
   *   specified.
   *
	 * @apiParam {String[]} [addresses] A comma-separated list of addresses to filter name owners by. If not provided, the
   *   whole network is queried.
   *
	 * @apiUse LimitOffset
	 * @apiQuery {String} [orderBy=name] The field to order the results by. Must be one of `name`, `owner`,
   *   `original_owner`, `registered` `updated`, `transferred`, `transferredOrRegistered`, `a` or `unpaid`.
	 * @apiQuery {String} [order=ASC] The direction to order the results in. Must be one of `ASC` or `DESC`.
   *
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   * @apiUse Names
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "count": 20,
   *   "total": 45,
   *   "names": [
   *     {
   *       "name": "ahh11",
   *       "owner": "khugepoopy",
   *       "registered": "2016-06-12T13:21:41.000Z",
   *       "updated": "2018-04-06T16:54:53.000Z",
   *       "transferred": "2018-04-06T16:54:53.000Z",
   *       "a": null,
   *       "unpaid": 0
   *     },
   *     {
   *       "name": "antiblock",
   *       "owner": "kreichdyes",
   *       "registered": "2020-01-25T12:18:14.000Z",
   *       "updated": "2020-01-25T12:18:14.000Z",
   *       "transferred": null,
   *       "a": null,
   *       "unpaid": 0
   *     },
   *     ...
   */
  router.get("/names/:addresses?", async (req: LookupQuery, res) => {
    const { addresses: addressesParam } = req.params;

    // Validate address list
    const addressList = addressesParam
      ? validateAddressList(addressesParam) : undefined;

    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(NAME_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);

    // Perform the query
    const { rows, count } = await lookupNames(
      addressList, limit, offset, orderBy, order
    );

    return res.json({
      ok: true,
      count: rows.length,
      total: count,
      names: rows.map(nameToJson)
    });
  });

  /**
   * @api {get} /lookup/names/:name/history Lookup name history
   * @apiName LookupNameHistory
   * @apiGroup LookupGroup
   * @apiVersion 2.8.9
   *
   * @apiDescription Return all the transactions directly involving the given name. This is any transaction with the
   *   type `name_purchase`, `name_a_record` or `name_transfer`.
   *
	 * @apiParam {String} name The name to return history for.
   *
	 * @apiUse LimitOffset
	 * @apiQuery {String} [orderBy=id] The field to order the results by. Must be one of `id`, `from`, `to`, `value`,
   *   `time`, `sent_name` or `sent_metaname`.
	 * @apiQuery {String} [order=ASC] The direction to order the results in. Must be one of `ASC` or `DESC`.
   *
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   * @apiUse Transactions
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "count": 20,
   *   "total": 50,
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
  router.get("/names/:name/history", async (req: LookupQuery, res) => {
    const { name } = req.params;

    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(TRANSACTION_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);

    // Perform the query. `time` is replaced with `id` as usual.
    const { rows, count } = await lookupNameHistory(
      name,
      limit,
      offset,
      orderBy === "time" ? "id" : orderBy,
      order
    );

    return res.json({
      ok: true,
      count: rows.length,
      total: count,
      transactions: rows.map(transactionToJson)
    });
  });

  /**
   * @api {get} /lookup/names/:name/transactions Lookup name transactions
   * @apiName LookupNameTransactions
   * @apiGroup LookupGroup
   * @apiVersion 2.8.9
   *
   * @apiDescription Return all the transactions sent to the given name.
   *
	 * @apiParam {String} name The name to return transactions for.
   *
	 * @apiUse LimitOffset
	 * @apiQuery {String} [orderBy=id] The field to order the results by. Must be one of `id`, `from`, `to`, `value`,
   *   `time`, `sent_name` or `sent_metaname`.
	 * @apiQuery {String} [order=ASC] The direction to order the results in. Must be one of `ASC` or `DESC`.
   *
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   * @apiUse Transactions
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "count": 20,
   *   "total": 50,
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
  router.get("/names/:name/transactions", async (req: LookupQuery, res) => {
    const { name } = req.params;

    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(TRANSACTION_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);

    // Perform the query. `time` is replaced with `id` as usual.
    const { rows, count } = await lookupTransactionsToName(
      name,
      limit,
      offset,
      orderBy === "time" ? "id" : orderBy,
      order
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
