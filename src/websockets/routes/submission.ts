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

import { ctrlSubmitBlock } from "../../controllers/blocks.js";
import { ErrorMissingParameter, ErrorSolutionDuplicate, ErrorSolutionIncorrect } from "../../errors/index.js";
import { addressToJson } from "../../krist/addresses/index.js";
import { blockToJson } from "../../krist/blocks/index.js";
import { WebSocketEventHandler } from "../types.js";

export const wsSubmitBlock: WebSocketEventHandler<{
  address?: string;
  nonce?: number[] | string;
}> = async (ws, { address, nonce }) => {
  try {
    if (ws.isGuest && !address)
      throw new ErrorMissingParameter("address");

    const result = await ctrlSubmitBlock(ws.req,
      address || ws.address, nonce);

    return {
      ok: true,
      success: true,
      work: result.work,
      address: addressToJson(result.address),
      block: blockToJson(result.block)
    };
  } catch (err: unknown) {
    if (err instanceof ErrorSolutionIncorrect
      || err instanceof ErrorSolutionDuplicate) {
      return {
        ok: true,
        success: false,
        error: err.errorString || "unknown_error"
      };
    } else {
      throw err; // let the websocket handle the original error
    }
  }
};
