/**
 * Created by Drew Lemmy, 2016-2021
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

const krist           = require("./../krist.js");
const utils           = require("./../utils.js");
const addresses       = require("./../addresses.js");
const tx              = require("./../transactions.js");
const names           = require("./../names.js");
const errors          = require("./../errors/errors.js");
const namesController = require("./../controllers/names.js");

module.exports = function(app) {
  /**
	 * @apiDefine NameGroup Names
	 *
	 * All Name related endpoints.
	 */

  /**
	 * @apiDefine Name
	 *
	 * @apiSuccess {Object} name
	 * @apiSuccess {String} name.name The name.
	 * @apiSuccess {String} name.owner The address that currently owns this name.
	 * @apiSuccess {Date} name.registered The time this name was registered.
	 * @apiSuccess {Date} name.updated The time this name was last updated.
	 * @apiSuccess {String} name.a The A record (or CNAME record) of this name.
	 */

  /**
	 * @apiDefine Names
	 *
	 * @apiSuccess {Object[]} names
	 * @apiSuccess {String} names.name The name.
	 * @apiSuccess {String} names.owner The address that currently owns this name.
	 * @apiSuccess {Date} names.registered The time this name was registered.
	 * @apiSuccess {Date} names.updated The time this name was last updated.
	 * @apiSuccess {String} names.a The A record (or CNAME record) of this name.
	 */

  app.get("/", async function(req, res, next) {
    if (typeof req.query.dumpnames !== "undefined") {
      const results = await names.getNames();
      let out = "";

      results.rows.forEach(function(name) {
        out += name.name + ";";
      });

      res.send(out);

      return;
    }

    if (req.query.a) {
      const name = await names.getNameByName(req.query.a);
      if (name) {
        res.send(name.a);
      } else {
        res.send("");
      }

      return;
    }

    if (req.query.getowner) {
      const name = await names.getNameByName(req.query.getowner);
      if (name) {
        res.send(name.owner);
      } else {
        res.send("");
      }

      return;
    }

    if (typeof req.query.nameCost !== "undefined") {
      return res.send(names.getNameCost().toString());
    }

    if (typeof req.query.namebonus !== "undefined") {
      res.send((await names.getUnpaidNameCount()).toString())

      return;
    }

    if (req.query.getnames) {
      const address = await addresses.getAddress(req.query.getnames);
      if (address) {
        const count = await names.getNameCountByAddress(address.address);
        res.send(count.toString());
      } else {
        res.send("0");
      }

      return;
    }

    if (req.query.listnames) {
      const address = await addresses.getAddress(req.query.listnames);
      if (address) {
        const results = await names.getNamesByAddress(address.address);
        let out = "";

        results.rows.forEach(function(name) {
          out += name.name + ";";
        });

        res.send(out);
      } else {
        res.send("Error4");
      }

      return;
    }

    if (typeof req.query.getnewdomains !== "undefined") {
      const results = await names.getUnpaidNames();
      let out = "";

      results.forEach(function(name) {
        out += name.name + ";";
      });

      res.send(out);

      return;
    }

    if (req.query.name_check) {
      if (!krist.isValidName(req.query.name_check)) {
        return res.send("0");
      }

      const name = await names.getNameByName(req.query.name_check);
      if (name) {
        res.send("0");
      } else {
        res.send("01"); // look at Taras's code and you'll know why :^)
      }

      return;
    }

    if (typeof req.query.name_new !== "undefined") {
      if (!req.query.name || !req.query.pkey || !krist.isValidName(req.query.name)) {
        return res.send("Error6");
      }

      const desiredName = req.query.name.toLowerCase();

      const name = await names.getNameByName(desiredName);
      if (name) {
        res.send("Error5");
      } else {
        const results = await addresses.verify(req, krist.makeV2Address(req.query.pkey), req.query.pkey);
        const authed = results.authed;
        const address = results.address;

        if (!authed) {
          return res.send("Access denied");
        }

        if (address.balance < names.getNameCost()) {
          return res.send("Error1");
        }

        address.decrement({balance: names.getNameCost()});
        address.increment({totalout: names.getNameCost()});

        tx.createTransaction("name", address.address, names.getNameCost(), desiredName, null);
        await names.createName(desiredName, address.address);
        res.send("Success");
      }

      return;
    }

    if (typeof req.query.name_transfer !== "undefined") {
      if (!req.query.name || !req.query.pkey || !krist.isValidName(req.query.name)) {
        return res.send("Error6");
      }

      if (!req.query.q || !krist.isValidKristAddress(req.query.q)) {
        return res.send("Error4");
      }

      const currentOwner = krist.makeV2Address(req.query.pkey);

      const results = await addresses.verify(req, currentOwner, req.query.pkey);
      const authed = results.authed;

      if (!authed) {
        return res.send("Access denied");
      }

      const name = await names.getNameByName(req.query.name.toLowerCase());
      if (!name || name.owner.toLowerCase() !== currentOwner.toLowerCase()) {
        res.send(req.query.name.toLowerCase());

        return;
      }

      await Promise.all([
        name.update({
          owner: req.query.q.toLowerCase(),
          updated: new Date()
        }),
        tx.pushTransaction(req.query.q.toLowerCase(), currentOwner.toLowerCase(), 0, name.name)
      ])
      
      res.send("Success");

      return;
    }

    if (typeof req.query.name_update !== "undefined") {
      if (!req.query.name || !req.query.pkey || !krist.isValidName(req.query.name)) {
        return res.send("Error6");
      }

      if (!req.query.ar || !krist.isValidARecord(req.query.ar)) {
        return res.send("Error8");
      }

      const owner = krist.makeV2Address(req.query.pkey);

      const results = await addresses.verify(req, owner, req.query.pkey);
      const authed = results.authed;

      if (!authed) {
        return res.send("Access denied");
      }

      const name = await names.getNameByName(req.query.name.toLowerCase());
      if (!name || name.owner.toLowerCase() !== owner.toLowerCase()) {
        return res.send(req.query.name.toLowerCase());
      }

      await name.update({ a: req.query.ar, updated: new Date()})
      res.send("Success");

      tx.createTransaction("a", owner.toLowerCase(), 0, name.name);

      return;
    }

    next();
  });

  app.get("/names/check/:name", async function(req, res) {
    if (!krist.isValidName(req.params.name)) {
      return utils.sendErrorToRes(req, res, new errors.ErrorInvalidParameter("name"));
    }

    const name = await names.getNameByName(req.params.name.toLowerCase());
    res.json({
      ok: true,
      available: !name
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
  app.get("/names/cost", async function(req, res) {
    res.json({
      ok: true,
      name_cost: names.getNameCost()
    });
  });

  /**
	 * @api {get} /names/bonus Get the name bonus
	 * @apiName GetNameBonus
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.1
	 *
	 * @apiDescription Returns the amount of KST that is currently added to the base block reward. Essentially, this is
	 * the count of names registered in the last 500 blocks.
	 *
	 * @apiSuccess {Number} name_bonus The name bonus.
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "name_bonus": 12
     * }
	 */
  app.get("/names/bonus", async function(req, res) {
    const count = await names.getUnpaidNameCount();
    res.json({
      ok: true,
      name_bonus: count
    });
  });

  /**
	 * @api {get} /names List all names
	 * @apiName GetNames
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
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
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-10T20:56:37.000Z",
     *             "updated": "2015-05-24T22:54:21.000Z",
     *             "a": null
     *         },
     *         {
     *             "name": "00",
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-14T14:35:40.000Z",
     *             "updated": "2015-05-24T22:47:56.000Z",
     *             "a": null
     *         },
	 *  	   ...
	 */
  app.get("/names", async function(req, res) {
    try {
      const results = await namesController.getNames(req.query.limit, req.query.offset);
      const names = [];

      results.rows.forEach(name => names.push(namesController.nameToJSON(name)));

      res.json({
        ok: true,
        count: names.length,
        total: results.count,
        names
      });
    } catch(error) {
      utils.sendErrorToRes(req, res, error);
    }
  });

  /**
	 * @api {get} /names/new List newest names
	 * @apiName GetNewNames
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription *Note*: This only returns names that are **unpaid**. An name is "paid off" after the submission
	 * 				   of 500 blocks after its registration.
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of names registered in the last 500 blocks.
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
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-10T20:56:37.000Z",
     *             "updated": "2015-05-24T22:54:21.000Z",
     *             "a": null
     *         },
     *         {
     *             "name": "00",
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-14T14:35:40.000Z",
     *             "updated": "2015-05-24T22:47:56.000Z",
     *             "a": null
     *         },
	 *  	   ...
	 */
  app.get("/names/new", async function(req, res) {
    try {
      const results = await namesController.getUnpaidNames(req.query.limit, req.query.offset);
      const names = [];

      results.rows.forEach(name => names.push(namesController.nameToJSON(name)));

      res.json({
        ok: true,
        count: names.length,
        total: results.count,
        names
      });
    } catch(error) {
      utils.sendErrorToRes(req, res, error);
    }
  });

  /**
	 * @api {get} /names/:name Get a name
	 * @apiName GetName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.1
	 *
	 * @apiParam (URLParameter) name The name to get.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "name": {
     *         "name": "00",
     *         "owner": "k9qyx784k7",
     *         "registered": "2015-05-14T14:35:40.000Z",
     *         "updated": "2015-05-24T22:47:56.000Z",
     *         "a": null
     *     }
     * }
	 */
  app.get("/names/:name", async function(req, res) {
    try {
      const dbName = await namesController.getName(req.params.name);
      
      res.json({
        ok: true,
        name: namesController.nameToJSON(dbName)
      });
    } catch (error) {
      utils.sendErrorToRes(req, res, error);
    }
  });

  /**
	 * @api {post} /names/:name Register a name
	 * @apiName RegisterName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} name The name you want to register.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
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
  app.post("/names/:name", async function(req, res) {
    try {
      await namesController.registerName(req, req.params.name, req.body.privatekey);
      res.json({
        ok: true
      });
    } catch(error) {
      utils.sendErrorToRes(req, res, error);
    }
  });


  /**
	 * @api {post} /names/:name/transfer Transfer a name
	 * @apiName TransferName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Transfers the name to another owner.
	 *
	 * @apiParam (URLParameter) {String} name The name you want to transfer.
	 * @apiParam (BodyParameter) {String} address The address you want to transfer the name to.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "name": {
     *         "name": "example",
     *         "owner": "kre3w0i79j",
     *         "registered": "2016-02-06T14:01:19.000Z",
     *         "updated": "2016-02-06T14:08:36.000Z",
     *         "a": null,
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
  app.post("/names/:name/transfer", async function(req, res) {
    try {
      const name = await namesController.transferName(req, req.params.name, req.body.privatekey, req.body.address);
      res.json({
        ok: true,
        name: namesController.nameToJSON(name)
      });
    } catch(error) {
      utils.sendErrorToRes(req, res, error);
    }
  });

  async function updateName(req, res) {
    try {
      const name = await namesController.updateName(req, req.params.name, req.body.privatekey, req.body.a);
      res.json({
        ok: true,
        name: namesController.nameToJSON(name)
      });
    } catch(error) {
      utils.sendErrorToRes(req, res, error);
    }
  }

  /**
	 * @api {post} /names/:name/update Update the A record of a name (POST)
	 * @apiName UpdateNamePOST
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Updates the A record of a name.
	 *
	 * @apiParam (URLParameter) {String} name The name you want to update.
	 * @apiParam (BodyParameter) {String} a The A record you want to set for the name.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "name": {
     *         "name": "example",
     *         "owner": "kre3w0i79j",
     *         "registered": "2016-02-06T14:01:19.000Z",
     *         "updated": "2016-02-06T14:08:36.000Z",
     *         "a": "krist.ceriat.net",
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
  app.post("/names/:name/update", updateName);

  /**
	 * @api {put} /names/:name Update the A record of a name (PUT)
	 * @apiName UpdateNamePUT
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Updates the A record of a name.
	 *
	 * @apiParam (URLParameter) {String} name The name you want to update.
	 * @apiParam (BodyParameter) {String} a The A record you want to set for the name.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "name": {
     *         "name": "example",
     *         "owner": "kre3w0i79j",
     *         "registered": "2016-02-06T14:01:19.000Z",
     *         "updated": "2016-02-06T14:08:36.000Z",
     *         "a": "krist.ceriat.net",
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
  app.put("/names/:name", updateName);

  return app;
};
