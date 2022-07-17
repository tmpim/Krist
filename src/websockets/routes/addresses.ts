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

import { ctrlGetAddress } from "../../controllers/addresses";
import { addressToJson } from "../../krist/addresses";

import { WebSocketEventHandler } from "../types";

/**
 * @api {ws} /type/address Get an address
 * @apiName WSGetAddress
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.4
 *
 * @apiBody {Number} id
 * @apiBody {String="address"} type
 * @apiBody {String} address
 * @apiBody {Boolean} [fetchNames] When supplied, fetch
 *   the count of names owned by the address.
 *
 * @apiUse Address
 */
export const wsGetAddress: WebSocketEventHandler<{
  address?: string;
  fetchNames?: boolean;
}> = async (_, msg) => {
  const fetchNames = !!msg.fetchNames;
  const address = await ctrlGetAddress(msg.address, fetchNames);

  return {
    ok: true,
    address: addressToJson(address)
  };
};
