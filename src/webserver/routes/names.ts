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

import { Request, Response, Router } from "express";

import {
  ctrlCheckName, ctrlGetName, ctrlGetNames, ctrlGetUnpaidNames,
  ctrlRegisterName, ctrlTransferName, ctrlUpdateName
} from "../../controllers/names";

import { getAddress } from "../../krist/addresses";

import {
  getName, getNameCountByAddress, getNames, getNamesByAddress,
  getUnpaidNameCount, getUnpaidNames, nameToJson
} from "../../krist/names";

import { isValidName } from "../../utils";
import { NAME_COST } from "../../utils/constants";
import { PaginatedQuery, ReqQuery, returnPaginatedResult } from "../utils";

/**
 * @apiDefine NameGroup Names
 *
 * All Name related endpoints.
 */

/**
 * @apiDefine Name
 *
 * @apiSuccess {Object} name
 * @apiSuccess {String} name.name The name, without the `.kst` suffix.
 * @apiSuccess {String} name.owner The address that currently owns this name.
 * @apiSuccess {String} name.original_owner The address that originally
 *   purchased this name.
 * @apiSuccess {Date} name.registered The time this name was registered, as an
 *   ISO-8601 string.
 * @apiSuccess {Date} name.updated The time this name was last updated - either
 *   the data changed, or it was transferred to a new owner, as an ISO-8601
 *   string.
 * @apiSuccess {Date} [name.transferred] The time this name was last transferred
 *   to a new owner, as an ISO-8601 string.
 * @apiSuccess {String} [name.a] The name's data.
 * @apiSuccess {Number} name.unpaid The number of blocks until this name has
 *   been paid off.
 */

/**
 * @apiDefine Names
 *
 * @apiSuccess {Object[]} names
 * @apiSuccess {String} names.name The name, without the `.kst` suffix.
 * @apiSuccess {String} names.owner The address that currently owns this name.
 * @apiSuccess {String} [names.original_owner] The address that originally
 *   purchased this name.
 * @apiSuccess {Date} names.registered The time this name was registered, as an
 *   ISO-8601 string.
 * @apiSuccess {Date} names.updated The time this name was last updated - either
 *   the data changed, or it was transferred to a new owner, as an ISO-8601
 *   string.
 * @apiSuccess {Date} [names.transferred] The time this name was last
 *   transferred to a new owner, as an ISO-8601 string.
 * @apiSuccess {String} names.a The name's data.
 * @apiSuccess {Number} names.unpaid The number of blocks until this name has
 *   been paid off.
 */

export default (): Router => {
  const router = Router();

  /**
	 * @api {get} /names/check/:name Check the availability of a name
	 * @apiName CheckName
	 * @apiGroup NameGroup
	 * @apiVersion 3.0.0
   *
	 * @apiParam name The name to check the availability of, without the `.kst`
   *   suffix.
	 *
	 * @apiSuccess {Boolean} available Whether or not the name is available
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "available": true
   * }
	 */
  router.get("/names/check/:name", async (req, res) => {
    res.json({
      ok: true,
      available: await ctrlCheckName(req.params.name)
    });
  });

  /**
	 * @api {get} /names/cost Get the cost of a name
	 * @apiName GetNameCost
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.1
	 *
	 * @apiSuccess {Number} name_cost The cost of a name
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "name_cost": 500
   * }
	 */
  router.get("/names/cost", async (req, res) => {
    res.json({
      ok: true,
      name_cost: NAME_COST
    });
  });

  /**
	 * @api {get} /names/bonus Get the name bonus
	 * @apiName GetNameBonus
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.1
	 *
	 * @apiDescription Returns the amount of KST that is currently added to the
	 *   base block reward. Essentially, this is the count of names registered in
	 *   the last 500 blocks.
	 *
	 * @apiSuccess {Number} name_bonus The name bonus.
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "name_bonus": 12
   * }
	 */
  router.get("/names/bonus", async (req, res) => {
    res.json({
      ok: true,
      name_bonus: await getUnpaidNameCount()
    });
  });

  /**
	 * @api {get} /names List all names
	 * @apiName GetNames
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiUse LimitOffset
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of names.
	 * @apiUse Names
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "count": 50,
   *     "total": 570,
   *     "names": [
   *         {
   *             "name": "0",
   *             "owner": "kxxxxxxxxx",
   *             "original_owner": "kmr20h6bvb",
   *             "registered": "2015-05-10T20:56:37.000Z",
   *             "updated": "2020-01-04T05:07:45.000Z",
	 *             "transferred": "2020-01-04T05:07:45.000Z",
   *             "a": null,
   *             "unpaid": 0
   *         },
   *         {
   *             "name": "00",
   *             "owner": "k9qyx784k7",
   *             "registered": "2015-05-14T14:35:40.000Z",
   *             "updated": "2015-05-24T22:47:56.000Z",
	 *             "transferred": "2015-05-24T22:36:54.000Z",
   *             "a": null,
   *             "unpaid": 0
   *         },
	 *  	   ...
	 */
  router.get("/names", async (req: PaginatedQuery, res) => {
    const results = await ctrlGetNames(req.query.limit, req.query.offset);
    returnPaginatedResult(res, "names", nameToJson, results);
  });

  /**
	 * @api {get} /names/new List newest names
	 * @apiName GetNewNames
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription *Note*: This only returns names that are **unpaid**. An
	 *   name is "paid off" after the submission of 500 blocks after its
	 *   registration.
	 *
	 * @apiUse LimitOffset
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of names registered in the last
	 *   500 blocks.
	 * @apiUse Names
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "count": 50,
   *     "total": 67,
   *     "names": [
   *         {
   *             "name": "0",
   *             "owner": "kxxxxxxxxx",
   *             "original_owner": "kmr20h6bvb",
   *             "registered": "2015-05-10T20:56:37.000Z",
   *             "updated": "2020-01-04T05:07:45.000Z",
	 *             "transferred": "2020-01-04T05:07:45.000Z",
   *             "a": null,
   *             "unpaid": 0
   *         },
   *         {
   *             "name": "00",
   *             "owner": "k9qyx784k7",
   *             "original_owner": "k9qyx784k7",
   *             "registered": "2015-05-14T14:35:40.000Z",
   *             "updated": "2015-05-24T22:47:56.000Z",
	 *             "transferred": "2015-05-24T22:36:54.000Z",
   *             "a": null,
   *             "unpaid": 0
   *         },
	 *       ...
	 */
  router.get("/names/new", async (req: PaginatedQuery, res) => {
    const results = await ctrlGetUnpaidNames(req.query.limit, req.query.offset);
    returnPaginatedResult(res, "names", nameToJson, results);
  });

  /**
	 * @api {get} /names/:name Get a name
	 * @apiName GetName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.1
	 *
	 * @apiParam name The name to get.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "name": {
   *         "name": "00",
   *         "owner": "k9qyx784k7",
   *         "original_owner": "k9qyx784k7",
   *         "registered": "2015-05-14T14:35:40.000Z",
   *         "updated": "2015-05-24T22:47:56.000Z",
   *         "transferred": "2015-05-24T22:36:54.000Z",
   *         "a": null,
   *         "unpaid": 0
   *     }
   * }
	 */
  router.get("/names/:name", async (req, res) => {
    const name = await ctrlGetName(req.params.name);
    res.json({
      ok: true,
      name: nameToJson(name)
    });
  });

  /**
	 * @api {post} /names/:name Register a name
	 * @apiName RegisterName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam {String} name The name you want to register, without the `.kst`
   *   suffix.
	 * @apiBody {String} privatekey The private key to your address.
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true
	 * }
	 *
	 * @apiErrorExample {json} Name Taken
	 * {
	 *     "ok": false,
	 *     "error": "name_taken"
	 * }
	 *
	 * @apiErrorExample {json} Insufficient Funds
	 * {
	 *     "ok": false,
	 *     "error": "insufficient_funds"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Name
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "name"
	 * }
	 */
  router.post("/names/:name", async (req, res) => {
    const name = await ctrlRegisterName(req, req.params.name,
      req.body.privatekey);

    res.json({
      ok: true,
      name: nameToJson(name)
    });
  });

  /**
	 * @api {post} /names/:name/transfer Transfer a name
	 * @apiName TransferName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Transfers the name to another owner.
	 *
	 * @apiParam {String} name The name you want to transfer, without the `.kst`
   *   suffix.
	 * @apiBody {String} address The address you want to transfer
	 *   the name to.
	 * @apiBody {String} privatekey The private key to your
	 *   address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "name": {
   *         "name": "example",
   *         "owner": "kre3w0i79j",
   *         "original_owner": "kre3w0i79j",
   *         "registered": "2016-02-06T14:01:19.000Z",
   *         "updated": "2016-02-06T14:08:36.000Z",
   *         "transferred": "2016-02-06T14:08:36.000Z",
   *         "a": null,
   *         "unpaid": 0
   *     }
   * }
	 *
	 * @apiErrorExample {json} Name Not Found
	 * {
	 *     "ok": false,
	 *     "error": "name_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Not Name Owner
	 * {
	 *     "ok": false,
	 *     "error": "not_name_owner"
	 * }
	 */
  router.post("/names/:name/transfer", async (req, res) => {
    const name = await ctrlTransferName(req, req.params.name,
      req.body.privatekey, req.body.address);

    res.json({
      ok: true,
      name: nameToJson(name)
    });
  });

  async function updateName(req: Request, res: Response) {
    const name = await ctrlUpdateName(req, req.params.name,
      req.body.privatekey, req.body.a);

    res.json({
      ok: true,
      name: nameToJson(name)
    });
  }

  /**
	 * @api {post} /names/:name/update Update the data of a name (POST)
	 * @apiName UpdateNamePOST
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Updates the data of a name.
	 *
	 * @apiParam {String} name The name you want to update, without the `.kst`
   *   suffix.
	 * @apiBody {String} [a] The data you want to set for the
   *   name. You may pass an empty string (`""`), `null` (in JSON requests), or
   *   omit the `a` parameter entirely to remove the data.
	 * @apiBody {String} privatekey The private key to your
   *   address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "name": {
   *         "name": "example",
   *         "owner": "kre3w0i79j",
   *         "original_owner": "kre3w0i79j",
   *         "registered": "2016-02-06T14:01:19.000Z",
   *         "updated": "2016-02-07T15:30:10.000Z",
   *         "transferred": "2016-02-06T14:08:36.000Z",
   *         "a": "krist.dev",
   *         "unpaid": 0
   *     }
   * }
	 *
	 * @apiErrorExample {json} Name Not Found
	 * {
	 *     "ok": false,
	 *     "error": "name_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Not Name Owner
	 * {
	 *     "ok": false,
	 *     "error": "not_name_owner"
	 * }
	 */
  router.post("/names/:name/update", updateName);

  /**
	 * @api {put} /names/:name Update the data of a name (PUT)
	 * @apiName UpdateNamePUT
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Updates the data of a name.
	 *
	 * @apiParam {String} name The name you want to update, without the `.kst`
   *   suffix.
	 * @apiBody {String} [a] The data you want to set for the
   *   name. You may pass an empty string (`""`), `null` (in JSON requests), or
   *   omit the `a` parameter entirely to remove the data.
	 * @apiBody {String} privatekey The private key to your
   *   address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
   *     "ok": true,
   *     "name": {
   *         "name": "example",
   *         "owner": "kre3w0i79j",
   *         "original_owner": "kre3w0i79j",
   *         "registered": "2016-02-06T14:01:19.000Z",
   *         "updated": "2016-02-07T15:30:10.000Z",
   *         "transferred": "2016-02-06T14:08:36.000Z",
   *         "a": "krist.dev",
   *         "unpaid": 0
   *     }
   * }
	 *
	 * @apiErrorExample {json} Name Not Found
	 * {
	 *     "ok": false,
	 *     "error": "name_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Not Name Owner
	 * {
	 *     "ok": false,
	 *     "error": "not_name_owner"
	 * }
	 */
  router.put("/names/:name", updateName);

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req: ReqQuery<{
    dumpnames?: string;
    a?: string;
    getowner?: string;
    nameCost?: string;
    namebonus?: string;
    getnames?: string;
    listnames?: string;
    getnewdomains?: string;
    name_check?: string;
    name_new?: string;
    name_transfer?: string;
    name_update?: string;
  }>, res, next) => {
    if (req.query.dumpnames !== undefined) {
      const { rows } = await getNames();
      return res.send(rows.map(n => n.name).join(";") + ";");
    }

    if (req.query.a) {
      const name = await getName(req.query.a);
      return res.send(name?.a ?? "");
    }

    if (req.query.getowner) {
      const name = await getName(req.query.getowner);
      return res.send(name?.owner ?? "");
    }

    if (req.query.nameCost !== undefined) {
      return res.send(NAME_COST.toString());
    }

    if (req.query.namebonus !== undefined) {
      res.send((await getUnpaidNameCount()).toString());
    }

    if (req.query.getnames) {
      const address = await getAddress(req.query.getnames);
      if (!address) return res.send("0");

      const count = await getNameCountByAddress(address.address);
      return res.send(count.toString());
    }

    if (req.query.listnames) {
      const address = await getAddress(req.query.listnames);
      if (!address) return res.send("Error4");

      const { rows } = await getNamesByAddress(address.address);
      return res.send(rows.map(n => n.name).join(";") + ";");
    }

    if (req.query.getnewdomains !== undefined) {
      const { rows } = await getUnpaidNames();
      return res.send(rows.map(n => n.name).join(";") + ";");
    }

    if (req.query.name_check) {
      if (!isValidName(req.query.name_check)) return res.send("0");
      const name = await getName(req.query.name_check);
      return res.send(name ? "0" : "01");
    }

    // Removed Legacy API calls
    if (req.query.name_new !== undefined)
      return res.send("Please use the new API");
    if (req.query.name_transfer !== undefined)
      return res.send("Please use the new API");
    if (req.query.name_update !== undefined)
      return res.send("Please use the new API");

    next();
  });

  return router;
};
