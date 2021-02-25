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

const utils               = require("./../utils.js");
const addressesController = require("./../controllers/addresses.js");
const blocksController    = require("./../controllers/blocks.js");
const blocks              = require("./../blocks.js");
const errors              = require("./../errors/errors.js");

module.exports = function(app) {
  app.get("/", async function(req, res, next) {
    if (typeof req.query.submitblock !== "undefined") {
      const { address, nonce } = req.query;

      try {
        await blocksController.submitBlock(req, address, nonce);
        res.send("Block solved");
      } catch (err) {
        // Convert v2 errors to legacy API errors
        if (err.errorString === "mining_disabled")
          return res.send("Mining disabled");
        if (err.parameter === "address")
          return res.send("Invalid address");
        if (err.parameter === "nonce")
          return res.send("Nonce is too large");
        if (err.errorString === "solution_duplicate")
          return res.send("Solution rejected");
        if (err.errorString === "solution_incorrect") {
          // v1 API returns address + lastBlockHash + nonce for invalid
          // solutions, not sure why
          const lastBlock = await blocks.getLastBlock();
          return res.send(address + lastBlock.hash.substr(0, 12) + nonce);
        }

        console.error(err);
        return res.send("Unknown error");
      }

      return;
    }

    next();
  });

  /**
	 * @api {post} /submit Submit a block
	 * @apiName SubmitBlock
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (BodyParameter) {String} address The address to send the reward to, if successful.
	 * @apiParam (BodyParameter) {String|Number[]} nonce The nonce to submit with.
	 *
	 * @apiSuccess {Boolean} success Whether the submission was successful or not.
	 * @apiSuccess {String} [error] The block submission error (if success was
   *   `false`).
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
   *     "success": false,
   *     "error": "solution_incorrect"
   * }
	 *
	 * @apiSuccessExample {json} Solution Duplicate
	 * {
   *     "ok": true,
   *     "success": false,
   *     "error": "solution_duplicate"
   * }
	 *
	 * @apiErrorExample {json} Invalid Nonce
	 * {
   *     "ok": false,
   *     "error": "invalid_parameter",
   *     "parameter": "nonce"
   * }
	 */
  app.post("/submit", async function(req, res) {
    try {
      const result = await blocksController.submitBlock(req, req.body.address, req.body.nonce);

      res.json({
        ok: true,
        success: true,
        work: result.work,
        address: addressesController.addressToJSON(result.address),
        block: blocksController.blockToJSON(result.block)
      });
    } catch (error) {
      if (error instanceof errors.ErrorSolutionIncorrect || error instanceof errors.ErrorSolutionDuplicate) {
        res.json({
          ok: true,
          success: false,
          error: error.errorString || "unknown_error"
        });
      } else {
        utils.sendErrorToRes(req, res, error);
      }
    }
  });

  return app;
};
