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

import { AddressJson, addressToJson } from "../../../krist/addresses";
import { lookupAddresses } from "../../../krist/addresses/lookup";

import { ErrorMissingParameter } from "../../../errors";
import { validateAddressList } from "./utils";

export default (): Router => {
  const router = Router();

  /**
   * @api {get} /lookup/addresses/:addresses Lookup addresses
   * @apiName LookupAddresses
   * @apiGroup LookupGroup
   * @apiVersion 2.1.3
   *
   * @apiDescription Return an object containing the given address(es). Any
   * addresses that do not exist on the Krist server (i.e. they have not been
   * logged in to, or have not received Krist) will be assigned `null` in the
   * object.
   *
   * **WARNING:** The Lookup API is in Beta, and is subject to change at any
   * time without warning.
   *
   * @apiParam {String[]} [addresses] A comma-separated list of
   *           addresses to filter transactions to/from.
   *
   * @apiQuery {Boolean} fetchNames When supplied, fetch the
   *           count of owned names for each address.
   *
   * @apiSuccess {Number} found The amount of addresses that were successfully
   *             returned.
   * @apiSuccess {Number} notFound The amount of addresses that were not
   *             returned.
   * @apiSuccess {Object} addresses Object keyed by address containing their
   *             data, or `null` if the address was not found.
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "found": 3,
   *   "notFound": 1,
   *   "addresses": {
   *     "kfakeaddy0": null,
   *     "khugepoopy": {
   *       "address": "khugepoopy",
   *       "balance": 433,
   *       "totalin": 467572,
   *       "totalout": 242505,
   *       "firstseen": "2017-04-12T20:23:02.000Z"
   *     },
   *     "kreichdyes": {
   *       "address": "kreichdyes",
   *       "balance": 210,
   *       "totalin": 65518,
   *       "totalout": 69767,
   *       "firstseen": "2018-06-28T17:30:50.000Z"
   *     },
   *     "kre3w0i79j": {
   *       "address": "kre3w0i79j",
   *       "balance": 0,
   *       "totalin": 227329,
   *       "totalout": 227277,
   *       "firstseen": "2015-03-13T12:55:18.000Z"
   *     }
   *   }
   * }
   */
  router.get("/addresses/:addresses", async (req, res) => {
    const { addresses: addressesParam } = req.params;
    const fetchNames = req.query.fetchNames !== undefined;

    // Validate address list
    if (!addressesParam) throw new ErrorMissingParameter("addresses");
    const addressList = validateAddressList(addressesParam);

    // Perform the query
    const rows = await lookupAddresses(addressList, fetchNames);

    // Prepare the output object (initialize all supplied addresses with 'null')
    const out: Record<string, AddressJson | null> = {};
    for (const address of addressList) {
      out[address] = null;
    }

    // Populate the output object with the addresses we actually found
    for (const address of rows) {
      out[address.address] = addressToJson(address);
    }

    return res.json({
      ok: true,
      found: rows.length,
      notFound: addressList.length - rows.length,
      addresses: out
    });
  });

  return router;
};
