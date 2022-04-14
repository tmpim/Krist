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

import { addressToJson, getAddress } from "../../krist/addresses";
import { WebSocketEventHandler } from "../types";
import { ErrorAddressNotFound } from "../../errors";

/**
 * @api {ws} //ws:"type":"me" Get information about the user
 * @apiName WSMe
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.2
 *
 * @apiBody {Number} id
 * @apiBody {String="me"} type
 *
 * @apiSuccess {Boolean} isGuest Whether the current user is a guest or not
 * @apiUse Address
 *
 * @apiSuccessExample {json} Success as guest
 * {
 *     "ok": true,
 *     "id": 1,
 *     "isGuest": true
   * }
 *
 * @apiSuccessExample {json} Success as authed user
 * {
 *     "ok": true,
 *     "id": 1,
 *     "isGuest": false,
 *     "address": {
 *         "address": "knggsn1d2e",
 *         "balance": 0,
 *         "totalin": 0,
 *         "totalout": 0,
 *         "firstseen": "2016-06-17T21:09:28.000Z"
 *     }
   * }
 */
export const wsGetMe: WebSocketEventHandler = async ws => {
  if (ws.isGuest) {
    return { ok: true, isGuest: true };
  } else {
    const address = await getAddress(ws.address);
    if (!address) throw new ErrorAddressNotFound(ws.address);
    return {  ok: true, isGuest: false, address: addressToJson(address) };
  }
};
