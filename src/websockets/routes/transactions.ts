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

import { ctrlMakeTransaction } from "../../controllers/transactions";
import { transactionToJson } from "../../krist/transactions";

import { WebSocketEventHandler } from "../types";

import { ErrorMissingParameter } from "../../errors";

/**
 * @api {ws} //ws:"type":"make_transaction" Make a transaction
 * @apiName WSMakeTransaction
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.7
 *
 * @apiBody {Number} id
 * @apiBody {String="make_transaction"} type
 * @apiBody {String} [privatekey] The privatekey of your
 *   address.
 * @apiBody {String} to The recipient of the transaction.
 * @apiBody {Number} amount The amount to send to the
 *   recipient.
 * @apiBody {String} [metadata] Optional metadata to
 *   include in the transaction.
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
export const wsMakeTransaction: WebSocketEventHandler<{
  privatekey?: string;
  to?: string;
  amount?: string | number;
  metadata?: string;
}> = async (ws, msg) => {
  if (ws.isGuest && !msg.privatekey)
    throw new ErrorMissingParameter("privatekey");

  const tx = await ctrlMakeTransaction(
    ws.req,
    msg.privatekey || ws.privatekey,
    msg.to,
    msg.amount,
    msg.metadata
  );

  return {
    ok: true,
    transaction: transactionToJson(tx)
  };
};
