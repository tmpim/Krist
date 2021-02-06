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

const blocksController = require("./../controllers/blocks.js");
const blocks           = require("./../blocks.js");
const utils            = require("./../utils.js");
const moment           = require("moment");

module.exports = function(app) {
  /**
	 * @apiDefine BlockGroup Blocks
	 *
	 * All Block related endpoints.
	 */

  /**
	 * @apiDefine Block
	 *
	 * @apiSuccess {Object} block
	 * @apiSuccess {Number} block.height The height (ID) of this block.
	 * @apiSuccess {String} block.address The address which submitted this block.
	 * @apiSuccess {String} block.hash The full-length SHA-256 hash of this block. The hash is calculated by the SHA-256
	 * 						of the submitter's address, the 12-char SHA-256 of the last block, and the nonce.
	 * @apiSuccess {String} block.short_hash The hash trimmed to 12 characters.
	 * @apiSuccess {Number} block.value The reward value of this block.
	 * @apiSuccess {Number} block.difficulty The difficulty at the time the block was mined.
	 * @apiSuccess {Date} block.time The time this block was submitted.
	 */

  /**
	 * @apiDefine Blocks
	 *
	 * @apiSuccess {Object[]} blocks
	 * @apiSuccess {Number} blocks.height The height (ID) of this block.
	 * @apiSuccess {String} blocks.address The address which submitted this block.
	 * @apiSuccess {String} blocks.hash The full-length SHA-256 hash of this block. The hash is calculated by the SHA-256
	 * 						of the submitter's address, the 12-char SHA-256 of the last block, and the nonce.
	 * @apiSuccess {String} blocks.short_hash The hash trimmed to 12 characters.
	 * @apiSuccess {Number} blocks.value The reward value of this block.
	 * @apiSuccess {Number} blocks.difficulty The difficulty at the time the block was mined.
	 * @apiSuccess {Date} blocks.time The time this block was submitted.
	 */

  app.get("/", function(req, res, next) {
    if (typeof req.query.lastblock !== "undefined") {
      blocks.getLastBlock().then(function(block) {
        res.send(block.hash.substring(0, 12));
      });

      return;
    }

    if (typeof req.query.getbaseblockvalue !== "undefined") {
      blocks.getLastBlock().then(function(block) {
        res.send(blocks.getBaseBlockValue(block.id).toString());
      });

      return;
    }

    if (req.query.getblockvalue) {
      blocks.getBlock(Math.max(parseInt(req.query.getblockvalue), 0)).then(function(block) {
        if (!block) {
          return res.send("50");
        }

        res.send(block.value.toString());
      });

      return;
    }

    if (typeof req.query.blocks !== "undefined") {
      if (typeof req.query.low !== "undefined") {
        blocks.getBlocksByOrder([["hash", "ASC"]], 50).then(function(results) {
          let out = "";

          results.rows.forEach(function (block) {
            if (block.hash === null) return;
            if (block.id === 1) return;

            out += moment(block.time).format("MMM DD").toString();
            out += utils.padDigits(block.id, 6);
            out += block.hash.substring(0, 20);
          });

          res.send(out);
        });
      } else {
        blocks.getBlocks(50).then(function(results) {
          let out = "";

          let k = false;

          results.rows.forEach(function (block) {
            if (block.hash === null) return;
            if (block.id === 1) return;

            if (!k) {
              out += utils.padDigits(block.id, 8);
              out += moment(block.time).format("YYYY-MM-DD").toString();

              k  = true;
            }

            out += moment(block.time).format("HH:mm:ss").toString();
            out += block.address.substring(0, 10);
            out += block.hash.substring(0, 12);
          });

          res.send(out);
        });
      }

      return;
    }

    next();
  });

  /**
	 * @api {get} /blocks List all blocks
	 * @apiName GetBlocks
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total amount of blocks.
	 * @apiUse Blocks
	 *
	 * @apiDescription *Note*: The count may be slightly different to the limit. This is because invalid blocks are
	 * 				   excluded from this query, and in the early days of Krist there were several invalid blocks
	 * 				   submitted.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 49,
     *     "total": 100000
     *     "blocks": [
     *         {
     *             "height": 2,
     *             "address": "a5dfb396d3",
     *             "hash": "00480dc35dc111d9953e5182df7d7f404a62d2b0d71ed51a873a81d89e78fbd8",
     *             "short_hash": "00480dc35dc1",
     *             "value": 50,
     *             "time": "2015-02-14T20:42:30.000Z"
     *         },
     *         {
     *             "height": 3,
     *             "address": "a5dfb396d3",
     *             "hash": "0046a3582fed130ee18c05e7e278992678d46e311465a4af6b787f5c014640a9",
     *             "short_hash": "0046a3582fed",
     *             "value": 50,
     *             "time": "2015-02-14T20:48:43.000Z"
     *         },
	 *  	   ...
	 */
  app.get("/blocks", function(req, res) {
    blocksController.getBlocks(req.query.limit, req.query.offset, true).then(function(results) {
      const out = [];

      results.rows.forEach(function(block) {
        if (block.hash === null) return;
        if (block.id === 1) return;

        out.push(blocksController.blockToJSON(block));
      });

      res.json({
        ok: true,
        count: out.length,
        total: results.count,
        blocks: out
      });
    }).catch(function(error) {
      utils.sendErrorToRes(req, res, error);
    });
  });

  /**
	 * @api {get} /blocks/latest List latest blocks
	 * @apiName GetLatestBlocks
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Blocks
	 *
	 * @apiDescription *Note*: The count may be slightly different to the limit. This is because invalid blocks are
	 * 				   excluded from this query, and in the early days of Krist there were several invalid blocks
	 * 				   submitted.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 50,
     *     "blocks": [
     *         {
     *             "height": 122225,
     *             "address": "kre3w0i79j",
     *             "hash": "1aa36f210f2e07b666646ac7dac3ea972262a6a474419edfc058e4402d40538d",
     *             "short_hash": "1aa36f210f2e",
     *             "value": 12,
     *             "time": "2016-02-02T17:55:35.000Z"
     *         },
     *         {
     *             "height": 122224,
     *             "address": "k123456789",
     *             "hash": "000000f31b3ca2cf166d0ee669cd2ae2be6ea0fc35d1cf1e7b52811ecb358796",
     *             "short_hash": "000000f31b3c",
     *             "value": 12,
     *             "time": "2016-02-01T14:18:47.000Z"
     *         },
	 *  	   ...
	 */
  app.get("/blocks/latest", function(req, res) {
    blocksController.getBlocks(req.query.limit, req.query.offset, false).then(function(results) {
      const out = [];

      results.rows.forEach(function(block) {
        if (block.hash === null) return;
        if (block.id === 1) return;

        out.push(blocksController.blockToJSON(block));
      });

      res.json({
        ok: true,
        count: out.length,
        total: results.count,
        blocks: out
      });
    }).catch(function(error) {
      utils.sendErrorToRes(req, res, error);
    });
  });

  /**
	 * @api {get} /blocks/lowest List blocks with the lowest hash
	 * @apiName GetLowestBlocks
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Blocks
	 *
	 * @apiDescription *Note*: The count may be slightly different to the limit. This is because invalid blocks are
	 * 				   excluded from this query, and in the early days of Krist there were several invalid blocks
	 * 				   submitted.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 43,
     *     "blocks": [
     *         {
     *             "height": 110128,
     *             "address": "k5ztameslf",
     *             "hash": "000000000000fd42f2c046d9c0f99b6534c1e04a87902ebff7ed4396d1f5b4ea",
     *             "short_hash": "000000000000",
     *             "value": 12,
     *             "time": "2016-01-22T00:09:17.000Z"
     *         },
     *         {
     *             "height": 113253,
     *             "address": "k5ztameslf",
     *             "hash": "000000000001285d349f8781ac4f1d155472178e1150c0eb6a1cf4e441320f2c",
     *             "short_hash": "000000000001",
     *             "value": 14,
     *             "time": "2016-01-24T22:10:49.000Z"
     *         },
	 *  	   ...
	 */
  app.get("/blocks/lowest", async function(req, res) {
    try {
      const { rows, count } = await blocksController.getLowestHashes(req.query.limit, req.query.offset);

      res.json({
        ok: true,
        count: rows.length,
        total: count,
        blocks: rows.map(blocksController.blockToJSON)
      });
    } catch (error) {
      utils.sendErrorToRes(req, res, error);
    }
  });

  /**
	 * @api {get} /blocks/last Get the last block
	 * @apiName GetLastBlock
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiUse Block
	 *
	 * @apiDescription *Note*: The count may be slightly different to the limit. This is because invalid blocks are
	 * 				   excluded from this query, and in the early days of Krist there were several invalid blocks
	 * 				   submitted.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "block": {
     *         "height": 122225,
     *         "address": "kre3w0i79j",
     *         "hash": "1aa36f210f2e07b666646ac7dac3ea972262a6a474419edfc058e4402d40538d",
     *         "short_hash": "1aa36f210f2e",
     *         "value": 12,
     *         "time": "2016-02-02T17:55:35.000Z"
     *     }
     * }
	 */
  app.get("/blocks/last", function(req, res) {
    blocksController.getLastBlock().then(function(block) {
      res.json({
        ok: true,
        block: blocksController.blockToJSON(block)
      });
    }).catch(function(error) {
      utils.sendErrorToRes(req, res, error);
    });
  });

  /**
	 *
	 * @api {get} /blocks/basevalue Get the base block reward
	 * @apiName GetBlockBaseValue
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {Number} base_value - The base block reward.
	 *
	 * @apiDescription Returns the base block reward - the amount of Krist rewarded for submitting a block excluding
	 * 				   name rewards.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "base_value": 12
     * }
	 */
  app.get("/blocks/basevalue", function(req, res) {
    blocks.getLastBlock().then(function(block) {
      res.json({
        ok: true,
        base_value: blocks.getBaseBlockValue(block.id)
      });
    });
  });


  /**
	 *
	 * @api {get} /blocks/value Get the block reward
	 * @apiName GetBlockValue
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.6
	 *
	 * @apiSuccess {Number} value - The current block reward.
	 * @apiSuccess {Number} base_value - The base block reward.
	 *
	 * @apiDescription Returns the block reward - the base value plus the amount of unpaid names (names registered in
	 * 				   the last 500 blocks). This is how much Krist will be rewarded for mining a block right now.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "value": 2,
     *     "base_value": 1
     * }
	 */
  app.get("/blocks/value", function(req, res) {
    blocks.getLastBlock().then(function(block) {
      blocks.getBlockValue().then(function (value) {
        res.json({
          ok: true,
          value: value,
          base_value: blocks.getBaseBlockValue(block.id)
        });
      });
    });
  });

  /**
	 * @api {get} /blocks/:height Get a block
	 * @apiName GetBlock
	 * @apiGroup BlockGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} height The height of the block.
	 *
	 * @apiUse Block
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "block": {
     *         "height": 5000,
     *         "address": "b5591107c4",
     *         "hash": "0000003797c090eb72d87a391aeedbef89957f9627aea9807870df46eb13a7e3",
     *         "short_hash": "0000003797c0",
     *         "value": 50,
     *         "time": "2015-02-21T11:05:47.000Z"
     *     }
     * }
	 */
  app.get("/blocks/:height", function(req, res) {
    blocksController.getBlock(req.params.height).then(function(block) {
      res.json({
        ok: true,
        block: blocksController.blockToJSON(block)
      });
    }).catch(function(error) {
      utils.sendErrorToRes(req, res, error);
    });
  });

  return app;
};
