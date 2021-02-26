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

const tx           = require("./../transactions.js");
const txController = require("./../controllers/transactions.js");
const utils        = require("./../utils.js");
const moment       = require("moment");

module.exports = function(app) {
  /**
	 * @apiDefine TransactionGroup Transactions
	 *
	 * All Transactions related endpoints.
	 */

  /**
	 * @apiDefine Transaction
	 *
	 * @apiSuccess {Object} transaction
	 * @apiSuccess {Number} transaction.id The ID of this transaction.
	 * @apiSuccess {String} transaction.from The sender of this transaction. This may be `null` if the transaction was
	 * 						a block mining reward, or `"a"` if it was a name's A record change.
	 * @apiSuccess {String} transaction.to The recipient of this transaction. This may be `"name"` if the transaction
	 * 						was a name purchase.
	 * @apiSuccess {Number} transaction.value The amount of Krist transferred in this transaction. Can be `0`, notably
	 * 						if the transaction was a name's A record change.
	 * @apiSuccess {Date} transaction.time The time this transaction this was made.
	 * @apiSuccess {String} [transaction.name] The name associated with this transaction, or null.
	 * @apiSuccess {String} [transaction.metadata] Transaction metadata, or null.
	 * @apiSuccess {String} transaction.type The type of this transaction. May be `mined`, `transfer`, `name_purchase`,
   *            `name_a_record`, or `name_transfer`.
	 */

  /**
	 * @apiDefine Transactions
	 *
	 * @apiSuccess {Object[]} transactions
	 * @apiSuccess {Number} transactions.id The ID of this transaction.
	 * @apiSuccess {String} transactions.from The sender of this transaction. This may be `null` if the transaction was
	 * 						a block mining reward, or `"a"` if it was a name's A record change.
	 * @apiSuccess {String} transactions.to The recipient of this transaction. This may be `"name"` if the transaction
	 *						was a name purchase.
	 * @apiSuccess {Number} transactions.value The amount of Krist transferred in this transaction. Can be `0`, notably
	 * 						if the transaction was a name's A record change.
	 * @apiSuccess {Date} transactions.time The time this transaction this was made.
	 * @apiSuccess {String} [transactions.name] The name associated with this transaction, or null.
	 * @apiSuccess {String} [transactions.metadata] Transaction metadata, or null.
	 * @apiSuccess {String} transactions.type The type of this transaction. May be `mined`, `transfer`, `name_purchase`,
   *            `name_a_record`, or `name_transfer`.
	 */

  app.get("/", async function(req, res, next) {
    if (typeof req.query.recenttx !== "undefined") {
      tx.getRecentTransactions().then(function(transactions) {
        let out = "";

        transactions.forEach(function (transaction) {
          out += moment(transaction.time).format("MMM DD HH:mm");

          out += transaction.from;
          out += transaction.to;

          out += utils.padDigits(Math.abs(transaction.value), 8);
        });

        res.send(out);
      });

      return;
    }

    if (typeof req.query.pushtx !== "undefined") {
      return res.send("v1 transactions disabled. Contact Krist team");
    }

    if (typeof req.query.pushtx2 !== "undefined") {
      try {
        const { userAgent, origin } = utils.getReqDetails(req);

        const privatekey = req.query.pkey;
        const to = req.query.q;
        const amount = req.query.amt;
        const metadata = req.query.com;

        await txController.makeTransaction(req, privatekey, to, amount, metadata, userAgent, origin);
        res.send("Success");
      } catch (err) {
        // Convert v2 errors to legacy API errors
        if (err.errorString === "auth_failed")
          return res.send("Access denied");
        if (err.errorString === "insufficient_funds")
          return res.send("Error1"); // "Insufficient funds available"
        if (err.parameter === "amount")
          return res.send("Error2"); // "Not enough KST in transaction"
        if (err.parameter === "to")
          return res.send("Error4"); // "Invalid recipient address"
        if (err.parameter === "privatekey")
          return res.send("Missing privatekey");
        if (err.parameter === "metadata")
          return res.send("Invalid metadata");
        if (err.errorString === "name_not_found")
          return res.send("Name not found");

        console.error(err);
        return res.send("Unknown error");
      }

      return;
    }

    next();
  });

  /**
	 * @api {get} /transactions List all transactions
	 * @apiName GetTransactions
	 * @apiGroup TransactionGroup
	 * @apiVersion 2.3.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 * @apiParam (QueryParameter) {Boolean} [excludeMined] If specified, transactions from mining will be excluded.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of transactions.
	 * @apiUse Transactions
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 50,
     *     "total": 175000,
     *     "transactions": [
     *         {
     *             "id": 1,
     *             "from": null,
     *             "to": "0000000000",
     *             "value": 50,
     *             "time": "2015-02-14T16:44:40.000Z",
     *             "name": null,
     *             "metadata": null,
     *             "type": "mined"
     *         },
     *         {
     *             "id": 46,
     *             "from": "71fd7571b9",
     *             "to": "a5dfb396d3",
     *             "value": 1000,
     *             "time": "2015-02-14T23:15:39.000Z",
     *             "name": null,
     *             "metadata": null,
     *             "type": "transfer"
     *         },
	 *  	   ...
	 */
  app.get("/transactions", function(req, res) {
    txController.getTransactions(req.query.limit, req.query.offset, true, typeof req.query.excludeMined === "undefined").then(function(transactions) {
      const out = [];

      transactions.rows.forEach(function (transaction) {
        out.push(txController.transactionToJSON(transaction));
      });

      res.json({
        ok: true,
        count: out.length,
        total: transactions.count,
        transactions: out
      });
    }).catch(function(error) {
      utils.sendErrorToRes(req, res, error);
    });
  });

  /**
	 * @api {get} /transactions/latest List latest transactions
	 * @apiName GetLatestTransactions
	 * @apiGroup TransactionGroup
	 * @apiVersion 2.3.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 * @apiParam (QueryParameter) {Boolean} [excludeMined] If specified, transactions from mining will be excluded.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of transactions.
	 * @apiUse Transactions
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 50,
     *     "total": 175000,
     *     "transactions": [
     *         {
     *             "id": 153287,
     *             "from": null,
     *             "to": "kre3w0i79j",
     *             "value": 14,
     *             "time": "2016-02-06T19:22:41.000Z",
     *             "name": null,
     *             "metadata": null,
     *             "type": "mined"
     *         },
     *         {
     *             "id": 153286,
     *             "from": "kxxhsp1uzh",
     *             "to": "name",
     *             "value": 500,
     *             "time": "2016-02-06T14:01:19.000Z",
     *             "name": "exam",
     *             "metadata": null,
     *             "type": "name_purchase"
     *         },
	 *  	   ...
	 */
  app.get("/transactions/latest", function(req, res) {
    txController.getTransactions(req.query.limit, req.query.offset, false, typeof req.query.excludeMined === "undefined").then(function(transactions) {
      const out = [];

      transactions.rows.forEach(function (transaction) {
        out.push(txController.transactionToJSON(transaction));
      });

      res.json({
        ok: true,
        count: out.length,
        total: transactions.count,
        transactions: out
      });
    }).catch(function(error) {
      utils.sendErrorToRes(req, res, error);
    });
  });

  /**
	 * @api {get} /transactions/:id Get a transaction
	 * @apiName GetTransaction
	 * @apiGroup TransactionGroup
	 * @apiVersion 2.3.0
	 *
	 * @apiParam (URLParameter) {Number} id The ID of the transaction to get.
	 *
	 * @apiUse Transaction
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "transaction": {
     *         "id": 153282,
     *         "from": "kh9w36ea1b",
     *         "to": "kutlg1kzhz",
     *         "value": 56610,
     *         "time": "2016-02-03T19:15:32.000Z",
     *         "name": null,
     *         "metadata": null,
     *         "type": "transfer"
     *     }
     * }
	 */
  app.get("/transactions/:id", function(req, res) {
    txController.getTransaction(req.params.id).then(function(transaction) {
      res.json({
        ok: true,
        transaction: txController.transactionToJSON(transaction)
      });
    }).catch(function(error) {
      utils.sendErrorToRes(req, res, error);
    });
  });

  /**
	 * @api {post} /transactions/ Make a transaction
	 * @apiName MakeTransaction
	 * @apiGroup TransactionGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (BodyParameter) {String} privatekey The privatekey of your address.
	 * @apiParam (BodyParameter) {String} to The recipient of the transaction.
	 * @apiParam (BodyParameter) {Number} amount The amount to send to the recipient.
	 * @apiParam (BodyParameter) {String} [metadata] Optional metadata to include in the transaction.
	 *
	 * @apiUse Transaction
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true
     * }
	 *
	 * @apiErrorExample {json} Insufficient Funds
	 * {
     *     "ok": false,
     *     "error": "insufficient_funds"
     * }
	 */
  app.post("/transactions", async function(req, res) {
    try {
      const { userAgent, origin } = utils.getReqDetails(req);
      const transaction = await txController.makeTransaction(req, req.body.privatekey, req.body.to, req.body.amount, req.body.metadata, userAgent, origin);
      res.json({
        ok: true,
        transaction: txController.transactionToJSON(transaction)
      });
    } catch (error) {
      utils.sendErrorToRes(req, res, error);
    }
  });

  return app;
};
