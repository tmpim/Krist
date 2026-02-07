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

import dayjs from "dayjs";
import { Router } from "express";
import { ctrlGetBlock, ctrlGetLastBlock } from "../../controllers/blocks.js";
import {
  blockToJson,
  GENESIS_HASH,
  getBlock,
  getBlocks,
  getBlockValue,
  getLastBlock,
  getLowestHashes
} from "../../krist/blocks/index.js";
import { getBaseBlockValue, padDigits } from "../../utils/index.js";
import { PaginatedQuery, ReqQuery, returnPaginatedResult } from "../index.js";

export default (): Router => {
  const router = Router();

  router.get("/blocks", async (req: PaginatedQuery, res) => {
    const results = await getBlocks(req.query.limit, req.query.offset, true);
    returnPaginatedResult(res, "blocks", blockToJson, results);
  });

  router.get("/blocks/latest", async (req: PaginatedQuery, res) => {
    const results = await getBlocks(req.query.limit, req.query.offset);
    returnPaginatedResult(res, "blocks", blockToJson, results);
  });

  router.get("/blocks/lowest", async (req: PaginatedQuery, res) => {
    const results = await getLowestHashes(req.query.limit, req.query.offset);
    returnPaginatedResult(res, "blocks", blockToJson, results);
  });

  router.get("/blocks/last", async (req, res) => {
    const block = await ctrlGetLastBlock();
    res.json({
      ok: true,
      block: blockToJson(block)
    });
  });

  router.get(["/blocks/value", "/blocks/basevalue"], async (req, res) => {
    const block = await ctrlGetLastBlock();
    const blockValue = await getBlockValue();

    res.json({
      ok: true,
      value: blockValue,
      base_value: getBaseBlockValue(block.id)
    });
  });

  router.get("/blocks/:height", async (req, res) => {
    const block = await ctrlGetBlock(req.params.height);
    res.json({
      ok: true,
      block: blockToJson(block)
    });
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req: ReqQuery<{
    lastblock?: string;
    getbaseblockvalue?: string;
    getblockvalue?: string;
    blocks?: string;
    low?: string;
  }>, res, next) => {
    if (req.query.lastblock !== undefined) {
      const block = await getLastBlock();
      if (!block) return res.send(GENESIS_HASH.substring(0, 12));
      return res.send((block.hash ?? GENESIS_HASH).substring(0, 12));
    }

    if (req.query.getbaseblockvalue !== undefined) {
      const block = await getLastBlock();
      if (!block) return res.send("50");
      return res.send(getBaseBlockValue(block.id).toString());
    }

    if (req.query.getblockvalue) {
      const n = Math.max(parseInt(req.query.getblockvalue), 0);
      const block = await getBlock(n);
      if (!block) return res.send("50");
      return res.send(block.value.toString());
    }

    if (req.query.blocks !== undefined) {
      if (req.query.low !== undefined) {
        const blocks = await getLowestHashes();

        const lines = blocks.rows.map(block => {
          // Skip the genesis block
          if (!block.hash || block.id < 10) return;

          return dayjs(block.time).format("MMM DD")
            + padDigits(block.id, 6)
            + block.hash.substring(0, 20);
        });

        return res.send(lines.join(""));
      } else {
        const blocks = await getBlocks(50);

        const lines = blocks.rows.map((block, i) => {
          if (!block.hash || block.id < 10) return;

          // Header row
          const header = i === 0
            ? padDigits(block.id, 8) + dayjs(block.time).format("YYYY-MM-DD")
            : "";

          return header
            + dayjs(block.time).format("HH:mm:ss")
            + block.address.substring(0, 10)
            + block.hash.substring(0, 12);
        });

        return res.send(lines.join(""));
      }
    }

    next();
  });

  return router;
};
