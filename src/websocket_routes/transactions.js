/**
 * Created by Drew Lemmy, 2016
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

const errors       = require("../errors/errors.js");
const txController = require("./../controllers/transactions.js");

module.exports = function(websockets) {
  /**
	 * @api {ws} //ws:"type":"make_transaction" Make a transaction
	 * @apiName WSMakeTransaction
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.7
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="make_transaction"} type
	 * @apiParam (WebsocketParameter) {String} [privatekey] The privatekey of your address.
	 * @apiParam (WebsocketParameter) {String} to The recipient of the transaction.
	 * @apiParam (WebsocketParameter) {Number} amount The amount to send to the recipient.
	 * @apiParam (WebsocketParameter) {String} [metadata] Optional metadata to include in the transaction.
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
  websockets.addMessageHandler("make_transaction", function(ws, message) {
    return new Promise(function(resolve, reject) {
      if (ws.isGuest && !message.privatekey) {
        return reject(new errors.ErrorMissingParameter("privatekey"));
      }

      txController.makeTransaction(message.privatekey || ws.privatekey, message.to, message.amount, message.metadata).then(function(transaction) {
        resolve({
          ok: true,
          transaction: txController.transactionToJSON(transaction)
        });
      }).catch(reject);
    });
  });
};
