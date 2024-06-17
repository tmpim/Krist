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

import chalkT from "chalk-template";
import { ErrorMissingParameter } from "../../errors/index.js";
import { addressToJson } from "../../krist/addresses/index.js";
import { verifyAddress } from "../../krist/addresses/verify.js";
import { getLogDetails } from "../../utils/index.js";
import { WebSocketEventHandler } from "../types.js";

/**
 * @api {ws} /type/login Login to a wallet (upgrade connection)
 * @apiName WSLogin
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.3
 *
 * @apiBody {Number} id
 * @apiBody {String="login"} type
 * @apiBody {String} privatekey
 *
 * @apiSuccess {Boolean} isGuest Whether the current user is a guest or not
 * @apiUse Address
 */
export const wsLogin: WebSocketEventHandler<{
  privatekey?: string;
}> = async (ws, { privatekey }) => {
  if (!privatekey) throw new ErrorMissingParameter("privatekey");

  const { logDetails } = getLogDetails(ws.req);
  const { address, authed } = await verifyAddress(ws.req, privatekey);

  if (authed) {
    console.log(chalkT`{cyan [Websockets]} Session {bold ${ws.address}} logging in as {bold ${address.address}} ${logDetails}`);

    ws.address = address.address;
    ws.privatekey = privatekey;
    ws.isGuest = false;

    return {
      ok: true,
      isGuest: false,
      address: addressToJson(address)
    };
  } else {
    console.log(chalkT`{red [Websockets]} Session {bold ${ws.address}} failed login as {bold ${address.address}} ${logDetails}`);

    ws.address = "guest";
    ws.isGuest = true;

    return {
      ok: true,
      isGuest: true
    };
  }
};
