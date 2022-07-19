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

import { WebSocketEventHandler } from "../types";

import { ctrlSubmitBlock } from "../../controllers/blocks";
import { addressToJson } from "../../krist/addresses";
import { blockToJson } from "../../krist/blocks";

import {
  ErrorMissingParameter, ErrorSolutionDuplicate, ErrorSolutionIncorrect
} from "../../errors";

/**
 * @api {ws} /type/submit_block Submit a block
 * @apiName WSSubmitBlock
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.8
 * @apiDeprecated Block submission is currently disabled.
 *
 * @apiBody {Number} id
 * @apiBody {String="submit_block"} type
 * @apiBody {String} [address]
 * @apiBody {String|Number[]} nonce
 *
 * @apiSuccess {Boolean} success Whether the submission was successful or not.
 * @apiSuccess {Number} [work] The new difficulty for block submission (if the solution was successful).
 * @apiUse Address
 * @apiUse Block
 * @apiSuccess {Object} [address] The address of the solver (if the solution was successful).
 * @apiSuccess {Object} [block] The block which was just submitted (if the solution was successful).
 *
 * @apiSuccessExample {json} Success
 * {
 *     "ok": true,
 *     "success": true,
 *     "work": 18750,
 *     "address": {
 *         "address": "kre3w0i79j",
 *         "balance": 925378,
 *         "totalin": 925378,
 *         "totalout": 0,
 *         "firstseen": "2015-03-13T12:55:18.000Z"
 *     },
 *     "block": {
 *         "height": 122226,
 *         "address": "kre3w0i79j",
 *         "hash": "000000007abc9f0cafaa8bf85d19817ee4f5c41ae758de3ad419d62672423ef",
 *         "short_hash": "000000007ab",
 *         "value": 14,
 *         "time": "2016-02-06T19:22:41.746Z"
 *     }
 * }
 *
 * @apiSuccessExample {json} Solution Incorrect
 * {
 *     "ok": true,
 *     "success": false
 * }
 *
 * @apiErrorExample {json} Invalid Nonce
 * {
 *     "ok": false,
 *     "error": "invalid_parameter",
 *     "parameter": "nonce"
 * }
 */
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
