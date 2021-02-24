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

const errors              = require("../errors/errors.js");
const addressesController = require("./../controllers/addresses.js");
const blocksController    = require("./../controllers/blocks.js");

module.exports = function(websockets) {
  /**
	 * @api {ws} //ws:"type":"submit_block" Submit a block
	 * @apiName WSSubmitBlock
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.8
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="submit_block"} type
	 * @apiParam (WebsocketParameter) {String} [address]
	 * @apiParam (WebsocketParameter) {String|Number[]} nonce
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

  websockets.addMessageHandler("submit_block", async function(ws, message) {
    try {
      if (ws.isGuest && !message.address)
        throw new errors.ErrorMissingParameter("address");

      const result = await blocksController.submitBlock(ws.req, message.address || ws.auth, message.nonce);

      return {
        ok: true,
        success: true,
        work: result.work,
        address: addressesController.addressToJSON(result.address),
        block: blocksController.blockToJSON(result.block)
      };
    } catch (error) {
      if (error instanceof errors.ErrorSolutionIncorrect || error instanceof errors.ErrorSolutionDuplicate) {
        return {
          ok: true,
          success: false,
          error: error.errorString || "unknown_error"
        };
      } else {
        throw error; // let the websocket handle the original error
      }
    }
  });
};
