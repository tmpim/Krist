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

const constants           = require("./../constants.js");
const krist               = require("./../krist.js");
const utils               = require("./../utils.js");
const addressesController = require("./../controllers/addresses.js");
const blocksController    = require("./../controllers/blocks.js");
const blocks              = require("./../blocks.js");
const errors              = require("./../errors/errors.js");

module.exports = function(app) {
  app.get("/", async function(req, res, next) {
    if (typeof req.query.submitblock !== "undefined") {
      if (!await krist.isMiningEnabled()) 
        return res.send("Mining disabled");
        
      if (!req.query.address || !krist.isValidKristAddress(req.query.address))
        return res.send("Invalid address");
      if (!req.query.nonce || req.query.nonce.length > constants.nonceMaxSize)
        return res.send("Nonce is too large");
      
      const lastBlock = await blocks.getLastBlock();

      const last = lastBlock.hash.substr(0, 12);
      const difficulty = await krist.getWork();
      const hash = utils.sha256(req.query.address + last + req.query.nonce);

      if (parseInt(hash.substr(0, 12), 16) <= difficulty || krist.freeNonceSubmission) {
        try {
          await blocks.submit(req, hash, req.query.address, req.query.nonce);
          res.send("Block solved");
        } catch (err) {
          console.error(err);
          res.send("Solution rejected");
        }
      } else {
        res.send(req.query.address + last + req.query.nonce);
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
    } catch(error) {
      if (error instanceof errors.ErrorSolutionIncorrect) {
        res.json({
          ok: true,
          success: false
        });
      } else {
        utils.sendErrorToRes(req, res, error);
      }
    }
  });

  return app;
};
