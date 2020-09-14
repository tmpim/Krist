/**
 * Created by Drew Lemmy, 2020
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
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

const express      = require("express");
const krist        = require("../krist");
const transactions = require("../transactions");
const names        = require("../names");
const errors       = require("../errors/errors");
const utils        = require("../utils");

// Fair tradeoff between flexibility and parameter limitations
const ADDRESS_LIST_LIMIT = 128;

// Valid fields to order transaction lookups by
const TRANSACTION_FIELDS = ["id", "from", "to", "value", "time"];
// Valid fields to order name lookups by
const NAME_FIELDS = ["name", "owner", "registered", "updated"];

/** Validate a comma-separated list of addresses, returning an array of them
 * if it is valid, or throwing an error if it is not. */
function validateAddressList(addressList) {
  // If it doesn't match the address list regex, error
  if (!krist.isValidKristAddressList(addressList))
    throw new errors.ErrorInvalidParameter("addresses");

  // Deserialize address list
  const addresses = addressList.trim().split(",");

  // Check that they didn't supply too many addresses
  if (addresses.length > ADDRESS_LIST_LIMIT)
    throw new errors.ErrorLargeParameter("addresses");

  return addresses;
}

function validateOrderBy(validFields, order) {
  // Ignore unsupplied parameter
  if (typeof order === "undefined") return;

  if (typeof order !== "string" || !validFields.includes(order))
    throw new errors.ErrorInvalidParameter("orderBy");

  return order;
}

function validateOrder(order) {
  // Ignore unsupplied parameter
  if (typeof order === "undefined") return "ASC";

  if (typeof order !== "string" 
  || (order.toUpperCase() !== "ASC" && order.toUpperCase() !== "DESC"))
    throw new errors.ErrorInvalidParameter("order");
    
  return order.toUpperCase();
}

function validateLimit(limit) {
  // Ignore unsupplied parameter
  if (typeof limit === "undefined") return;

  // Convert to int
  limit = parseInt(limit);

  // Validate range
  if (isNaN(limit) || (limit && limit <= 0))
    throw new errors.ErrorInvalidParameter("limit");

  return limit;
}

function validateOffset(offset) {
  // Ignore unsupplied parameter
  if (typeof offset === "undefined") return;

  // Convert to int
  offset = parseInt(offset);

  // Validate range
  if (isNaN(offset) || (offset && offset <= 0))
    throw new errors.ErrorInvalidParameter("offset");

  return offset;
}

module.exports = function(app) {
  const api = express.Router();

  /**
	 * @apiDefine LookupGroup Lookup API
	 *
	 * Advanced bulk lookup queries designed for KristWeb v2.
   * 
   * **WARNING:** The Lookup API is in Beta, and is subject to change at any
   * time without warning. 
	 */

  /**
   * @api {get} /lookup/transactions/:addresses Lookup transactions
   * @apiName LookupTransactions
   * @apiGroup LookupGroup
   * @apiVersion 2.1.3
   *
   * @apiDescription **WARNING:** The Lookup API is in Beta, and is subject to
   * change at any time without warning. 
   * 
	 * @apiParam (QueryParameter) {String[]} [addresses] A comma-separated list of
   *           addresses to filter transactions to/from.
   * 
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of
   *           results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the
   *           results.
	 * @apiParam (QueryParameter) {String} [orderBy=id] The field to order the
   *           results by. Must be one of `id`, `from`, `to`, `value` or `time`.
	 * @apiParam (QueryParameter) {String} [order=ASC] The direction to order
   *           the results in. Must be one of `ASC` or `DESC`.
	 * @apiParam (QueryParameter) {Boolean} [includeMined] If supplied,
   *           transactions from mining will be included.
   * 
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   * @apiUse Transactions
   */
  api.get("/transactions/:addresses", async (req, res) => {
    const { addresses: addressesParam } = req.params;

    // Validate address list
    if (!addressesParam) throw new errors.ErrorMissingParameter("addresses");
    const addressList = validateAddressList(addressesParam);

    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(TRANSACTION_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);
    const includeMined = typeof req.query.includeMined !== "undefined";

    // Perform the query
    const { rows, count } = await transactions.getTransactionsByAddresses(
      addressList, limit, offset, orderBy, order, includeMined
    );

    return res.json({
      ok: true,
      count: rows.length,
      total: count,
      transactions: rows.map(transactions.transactionToJSON)
    });
  });

  /**
   * @api {get} /lookup/names/:addresses Lookup names
   * @apiName LookupNames
   * @apiGroup LookupGroup
   * @apiVersion 2.1.3
   *
   * @apiDescription **WARNING:** The Lookup API is in Beta, and is subject to
   * change at any time without warning. 
   * 
	 * @apiParam (QueryParameter) {String[]} [addresses] A comma-separated list of
   *           addresses to filter name owners by.
   * 
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of
   *           results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the
   *           results.
	 * @apiParam (QueryParameter) {String} [orderBy=id] The field to order the
   *           results by. Must be one of `name`, `owner`, `registered`, 
   *           `updated`.
	 * @apiParam (QueryParameter) {String} [order=ASC] The direction to order
   *           the results in. Must be one of `ASC` or `DESC`.
   * 
   * @apiSuccess {Number} count The count of results returned.
   * @apiSuccess {Number} total The total count of results available.
   * @apiUse Names
   */
  api.get("/names/:addresses", async (req, res) => {
    const { addresses: addressesParam } = req.params;

    // Validate address list
    if (!addressesParam) throw new errors.ErrorMissingParameter("addresses");
    const addressList = validateAddressList(addressesParam);

    // Query filtering parameters
    const limit = validateLimit(req.query.limit);
    const offset = validateOffset(req.query.offset);
    const orderBy = validateOrderBy(NAME_FIELDS, req.query.orderBy);
    const order = validateOrder(req.query.order);

    // Perform the query
    const { rows, count } = await names.getNamesByAddresses(
      addressList, limit, offset, orderBy, order
    );

    return res.json({
      ok: true,
      count: rows.length,
      total: count,
      names: rows.map(names.nameToJSON)
    });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  api.use((err, req, res, next) => {
    utils.sendErrorToRes(req, res, err);
  });

  app.use("/lookup", api);
};
