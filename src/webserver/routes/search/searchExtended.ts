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

import { InferAttributes } from "@sequelize/core";
import { Router } from "express";
import { Limit, Offset, PaginatedResult, Transaction } from "../../../database/index.js";
import { ErrorInvalidParameter, ErrorNameNotFound } from "../../../errors/index.js";
import { getName } from "../../../krist/names/index.js";
import {
  countTransactionsByAddress,
  getTransactionsByAddress,
  transactionToJson
} from "../../../krist/transactions/index.js";
import { countByName, countMetadata, searchByName, searchMetadata } from "../../../krist/transactions/lookup.js";
import { TRANSACTION_FIELDS, validateLimit, validateOffset, validateOrder, validateOrderBy } from "../lookup/index.js";
import { ReqSearchQuery, SearchExtendedResult } from "./index.js";
import { parseQuery, validateQuery } from "./utils.js";

async function performExtendedSearch(
  query: string
): Promise<SearchExtendedResult> {
  const parsed = parseQuery(query);
  const { matchAddress, matchName, strippedName } = parsed;

  // Check if the name exists before attempting to search by name
  const name = matchName ? await getName(strippedName) : undefined;

  const [addressInvolved, nameInvolved, metadata] = await Promise.all([
    // addressInvolved
    matchAddress
      ? countTransactionsByAddress(query, true)
      : false,

    // nameInvolved
    matchName && name
      ? countByName(name.name)
      : false,

    // metadata
    countMetadata(query)
  ]);

  return {
    query: parsed,
    matches: {
      transactions: {
        addressInvolved: addressInvolved as (number | false),
        nameInvolved: nameInvolved as (number | false),
        metadata: metadata as (number | false)
      }
    }
  };
}

// Type must be one of "address", "name", "metadata"
async function getExtendedSearchResults(
  query: string,
  type: "address" | "name" | "metadata",
  limit: Limit,
  offset: Offset,
  orderBy: keyof InferAttributes<Transaction> = "id",
  order: "ASC" | "DESC" = "DESC",
  includeMined?: boolean
): Promise<PaginatedResult<Transaction>> {
  const parsed = parseQuery(query);
  const { matchAddress, matchName, strippedName } = parsed;

  // Perform the appropriate lookup based on the type
  switch (type) {
  case "address": {
    if (!matchAddress) return { rows: [], count: 0 };

    // Perform the query. `time` is replaced with `id` as usual.
    return getTransactionsByAddress(
      query,
      limit,
      offset,
      includeMined,
      orderBy === "time" ? "id" : orderBy,
      order
    );
  }
  case "name": {
    if (!matchName) return { rows: [], count: 0 };

    // Check if the name exists before attempting to search by name
    const name = await getName(strippedName);
    if (!name) throw new ErrorNameNotFound(strippedName);

    // Perform the query. `time` is replaced with `id` as usual.
    return searchByName(
      name.name,
      limit,
      offset,
      orderBy === "time" ? "id" : orderBy,
      order
    );
  }
  case "metadata": {
    // Perform the query. `time` is replaced with `id` as usual.
    return searchMetadata(
      query,
      limit,
      offset,
      orderBy === "time" ? "id" : orderBy,
      order
    );
  }
  default: throw new ErrorInvalidParameter("type");
  }
}

export default (): Router => {
  const router = Router();

  /**
   * @api {get} /search/extended Search transactions
   * @apiName SearchExtended
   * @apiGroup LookupGroup
   * @apiVersion 2.8.0
   *
   * @apiDescription Search the Krist network for transactions that match the given query. The search is more in-depth
   * (and thus slower) than `/search`.
   *
   * - Transactions are searched by address involved (from, to)
   * - Transactions are searched by name involved (either a name transfer/update, or a transaction to a name)
   * - Transactions are searched by raw metadata (exact query match anywhere in the metadata)
   *
	 * @apiQuery {String} q The search query.
   *
   * @apiUse SearchQuery
   *
   * @apiSuccess {Object} matches The results of the search query.
   * @apiSuccess {Object} matches.transactions Information about transaction matches for the search query.
   * @apiSuccess {Number|Boolean} matches.transactions.addressInvolved The number of transactions that involve the query
   *   address (either in the `from` field or the `to` field), or `false` if the query isn't a valid Krist address.
   * @apiSuccess {Number|Boolean} matches.transactions.nameInvolved The number of transactions that involve the query
   *   name (either as a direct transfer/update, or as a transaction sent to a name; the `name` and `sent_name` fields
   *   respectively), or `false` if the query isn't a valid Krist name.
   * @apiSuccess {Number|Boolean} matches.transactions.metadata The number of transactions with metadata containing the
   *   query string.
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "query": {
   *     "originalQuery": "sc.kst",
   *     "matchAddress": false,
   *     "matchName": true,
   *     "matchBlock": false,
   *     "matchTransaction": false,
   *     "strippedName": "sc",
   *     "hasID": false
   *   },
   *   "matches": {
   *     "transactions": {
   *       "addressInvolved": false,
   *       "nameInvolved": 3361,
   *       "metadata": 3404
   *     }
   *   }
   * }
   */
  router.get("/extended", async (req, res) => {
    const query = validateQuery(req);

    // Don't allow the query to be too short (to not return tens of thousands
    // of results)
    if (query.length < 3) throw new ErrorInvalidParameter("q");

    const results = await performExtendedSearch(query);
    res.json({
      ok: true,
      ...results
    });
  });

  /**
   * @api {get} /search/extended/results/transactions/:type Search transaction results
   * @apiName SearchExtendedResults
   * @apiGroup LookupGroup
   * @apiVersion 2.8.11
   *
   * @apiDescription Search the Krist network for transactions that match the given query and return the results. The
   * type can be either `address`, `name` or `metadata`.
   *
   * - `address` - Transactions are searched by address involved (from, to)
   * - `name` - Transactions are searched by name involved (either a name transfer/update, or a transaction to a name)
   * - `metadata` - Transactions are searched by raw metadata (exact query match anywhere in the metadata)
   *
	 * @apiParam {String} type The type of search query to execute. Must be either `address`, `name` or `metadata`.
   *
	 * @apiQuery {String} q The search query.
	 * @apiQuery {Boolean} [includeMined] If supplied, transactions from mining will be included (only for `address`
   *   searches).
   *
   * @apiUse Transactions
   *
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   */
  router.get("/extended/results/transactions/:type", async (req: ReqSearchQuery, res) => {
    const query = validateQuery(req);

    const type = req.params.type as "address" | "name" | "metadata";
    if (!["address", "name", "metadata"].includes(type))
      throw new ErrorInvalidParameter("type");

    // Don't need to perform the length limit check on names because it's an
    // indexed field anyway, and addresses are always 10 characters. So this
    // basically only matters for metadata
    if (type !== "name" && query.length < 3)
      throw new ErrorInvalidParameter("q");

    // Query filtering parameters, see lookup API
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(TRANSACTION_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);
    const includeMined = req.query.includeMined !== undefined;

    const { rows, count } = await getExtendedSearchResults(
      query,
      type,
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
