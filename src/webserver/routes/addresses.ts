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

import dayjs from "dayjs";
import { Router } from "express";

import { ctrlGetAddress, ctrlGetAddressAlert, ctrlGetAddresses, ctrlGetRichAddresses } from "../../controllers/addresses";
import { ctrlGetNamesByAddress } from "../../controllers/names";
import { ctrlGetTransactionsByAddress } from "../../controllers/transactions";
import { addressToJson, getAddress, getRichAddresses } from "../../krist/addresses";
import { nameToJson } from "../../krist/names";
import { getTransactionsByAddress, transactionToJson } from "../../krist/transactions";
import { makeV2Address, padDigits } from "../../utils";

import { PaginatedQuery, ReqQuery, returnPaginatedResult } from "../utils";

/**
 * @apiDefine AddressGroup Addresses
 *
 * All Address related endpoints.
 */

/**
 * @apiDefine Address
 *
 * @apiSuccess {Object} address
 * @apiSuccess {String} address.address The address.
 * @apiSuccess {Number} address.balance The amount of Krist currently owned by
 *   this address.
 * @apiSuccess {Number} address.totalin The total amount of Krist that has ever
 *   gone into this address.
 * @apiSuccess {Number} address.totalout The total amount of Krist that has ever
 *   gone out of this address.
 * @apiSuccess {Date} address.firstseen The date this address was first seen
 *   (when the first transaction to it was made).
 */

/**
 * @apiDefine Addresses
 *
 * @apiSuccess {Object[]} addresses
 * @apiSuccess {String} addresses.address The address.
 * @apiSuccess {Number} addresses.balance The amount of Krist currently owned by
 *   this address.
 * @apiSuccess {Number} addresses.totalin The total amount of Krist that has
 *   ever gone into this address.
 * @apiSuccess {Number} addresses.totalout The total amount of Krist that has
 *   ever gone out of this address.
 * @apiSuccess {Date} addresses.firstseen The date this address was first seen
 *   (when the first transaction to it was made).
 */

export default (): Router => {
  const router = Router();

  // ===========================================================================
  // API v2
  // ===========================================================================
  /**
	 * @api {get} /addresses List all addresses
	 * @apiName GetAddresses
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of
	 *   results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the
	 *   results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total count of addresses.
	 * @apiUse Addresses
	 *
	 * @apiSuccessExample {json} Success
	 *      {
	 *  	    "ok": true,
	 *  	    "count": 50,
	 *  	    "total": 500,
	 *  	    "addresses": [
	 *  	        {
	 *  	            "address": "0000000000",
	 *  	            "balance": 0,
	 *  	            "totalin": 50,
	 *  	            "totalout": 50,
	 *  	            "firstseen": "2015-02-14T16:44:40.000Z"
	 *  	        },
	 *  	        {
	 *  	            "address": "a5dfb396d3",
	 *  	            "balance": 30000,
	 *  	            "totalin": 100000,
	 *  	            "totalout": 130000,
	 *  	            "firstseen": "2015-02-14T20:42:30.000Z"
	 *  	        },
	 *  	        ...
	 */
  router.get("/addresses", async (req: PaginatedQuery, res) => {
    const results = await ctrlGetAddresses(req.query.limit, req.query.offset);
    returnPaginatedResult(res, "addresses", addressToJson, results);
  });

  router.post("/addresses/alert", async (req, res) => {
    const alert = await ctrlGetAddressAlert(req.body.privatekey);
    res.json({
      ok: true,
      alert
    });
  });

  /**
	 * @api {get} /addresses/rich List the richest addresses
	 * @apiName GetRichAddresses
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of
	 *   results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the
	 *   results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total count of addresses.
	 * @apiUse Addresses
	 *
  * @apiSuccessExample {json} Success
	 *      {
	 *          "ok": true,
	 *          "count": 50,
	 *          "total": 500,
	 *          "addresses": [
	 *              {
	 *                  "address": "k2sdlnjo1m",
	 *                  "balance": 762010,
	 *                  "totalin": 11316,
	 *                  "totalout": 783984,
	 *                  "firstseen": "2016-01-24T05:08:14.000Z"
	 *              },
	 *              {
	 *                  "address": "k7u9sa6vbf",
	 *                  "balance": 505832,
	 *                  "totalin": 547785,
	 *                  "totalout": 41953,
	 *                  "firstseen": "2015-03-05T04:50:40.000Z"
	 *              },
	 *              ...
	 */
  router.get("/addresses/rich", async (req: PaginatedQuery, res) => {
    const results = await ctrlGetRichAddresses(req.query.limit,
      req.query.offset);
    returnPaginatedResult(res, "addresses", addressToJson, results);
  });

  /**
	 * @api {get} /addresses/:address Get an address
	 * @apiName GetAddress
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} address The address.
	 * @apiParam (QueryParameter) {Boolean} [fetchNames] When supplied, fetch the
   *   count of names owned by the address.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Address
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "address": {
	 *         "address": "kre3w0i79j",
	 *         "balance": 86945,
	 *         "totalin": 123364,
	 *         "totalout": 38292,
	 *         "firstseen": "2015-03-13T12:55:18.000Z"
	 *     }
	 * }
	 *
	 * @apiErrorExample {json} Address Not Found
	 * {
	 *     "ok": false,
	 *     "error": "address_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Address
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "address"
	 * }
	 */
  router.get("/addresses/:address", async (req, res) => {
    const fetchNames = req.query.fetchNames !== undefined;
    const address = await ctrlGetAddress(req.params.address, fetchNames);
    res.json({
      ok: true,
      address: addressToJson(address)
    });
  });


  /**
	 * @api {get} /addresses/:address/names Get all names registered to an address
	 * @apiName GetAddressNames
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} address The address.
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of
	 *   results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the
	 *   results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of names owned by this address.
	 * @apiUse Names
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "count": 8,
   *     "total": 8,
   *     "names": [
   *         {
   *             "name": "supercoolname",
   *             "owner": "kre3w0i79j",
   *             "registered": "2016-01-30T15:45:55.000Z",
   *             "updated": "2016-01-30T15:45:55.000Z",
   *             "a": null
   *         },
	 *
	 * @apiErrorExample {json} Address Not Found
	 * {
	 *     "ok": false,
	 *     "error": "address_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Address
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "address"
	 * }
	 */
  router.get("/addresses/:address/names", async (req: PaginatedQuery, res) => {
    const results = await ctrlGetNamesByAddress(req.params.address,
      req.query.limit, req.query.offset);
    returnPaginatedResult(res, "names", nameToJson, results);
  });

  /**
	 * @api {get} /addresses/:address/transactions Get the recent transactions
	 *   from an address
	 * @apiName GetAddressTransactions
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} address The address.
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of
	 *   results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the
	 *   results.
	 * @apiParam (QueryParameter) {Boolean} [excludeMined] If specified,
	 *   transactions from mining will be excluded.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of transactions this address
	 *   has made.
	 * @apiUse Transactions
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "count": 50,
   *     "total": 3799,
   *     "transactions": [
   *         {
   *             "id": 153197,
   *             "from": "kxxhsp1uzh",
   *             "to": "kre3w0i79j",
   *             "value": 75,
   *             "time": "2016-02-02T23:30:51.000Z",
   *             "name": null,
   *             "metadata": null,
   *             "type": "transfer"
   *         },
   *         {
   *             "id": 153196,
   *             "from": "kre3w0i79j",
   *             "to": "kxxhsp1uzh",
   *             "value": 50,
   *             "time": "2016-02-02T23:30:39.000Z",
   *             "name": null,
   *             "metadata": null,
   *             "type": "transfer"
   *         },
	 *
	 * @apiErrorExample {json} Address Not Found
	 * {
	 *     "ok": false,
	 *     "error": "address_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Address
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "address"
	 * }
	 */
  router.get("/addresses/:address/transactions", async (req: PaginatedQuery<{
    excludeMined?: string;
  }>, res) => {
    const results = await ctrlGetTransactionsByAddress(
      req.params.address,
      req.query.limit,
      req.query.offset,
      req.query.excludeMined === undefined
    );
    returnPaginatedResult(res, "transactions", transactionToJson, results);
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req: ReqQuery<{
    getbalance?: string;
    alert?: string;
    richapi?: string;
    listtx?: string;
    overview?: string;
    id?: string;
  }>, res, next) => {
    if (req.query.getbalance) {
      const address = await getAddress(req.query.getbalance);
      return res.send((address?.balance ?? 0).toString());
    }

    if (req.query.alert) {
      const from = makeV2Address(req.query.alert);
      const address = await getAddress(from);
      return res.send(address?.alert ?? "");
    }

    if (req.query.richapi !== undefined) {
      const { rows } = await getRichAddresses();

      const lines = rows.map(address =>
        address.address.substring(0, 10)
        + padDigits(address.balance, 8)
        + dayjs(address.firstseen).format("DD MMM YYYY"));

      return res.send(lines.join(""));
    }

    if (req.query.listtx) {
      const address = await getAddress(req.query.listtx);
      if (!address) return res.send("Error4");

      const { rows } = await getTransactionsByAddress(
        address.address,
        req.query.overview !== undefined ? 3 : 500,
        0,
        true
      );

      const lines = rows.map(tx => {
        let out = dayjs(tx.time).format("MMM DD HH:mm");

        let peer = "";
        let sign = "";

        if (tx.to === address.address) {
          peer = tx.from;
          sign = "+";
        } else if (tx.from === address.address) {
          peer = tx.to;
          sign = "-";
        }

        if (!tx.from || tx.from.length < 10) peer = "N/A(Mined)";
        if (!tx.to || tx.to.length < 10) peer = "N/A(Names)";

        out += peer;
        out += sign;
        out += padDigits(tx.value, 8);

        if (req.query.id !== undefined)
          out += padDigits(tx.id, 8);

        return out;
      });

      return res.send(lines.join("") + "end");
    }

    next();
  });

  return router;
};
