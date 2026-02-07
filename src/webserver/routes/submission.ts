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

import { Router } from "express";
import { ctrlSubmitBlock } from "../../controllers/blocks.js";
import {
  ErrorInvalidParameter,
  ErrorSolutionDuplicate,
  ErrorSolutionIncorrect,
  KristError
} from "../../errors/index.js";
import { addressToJson } from "../../krist/addresses/index.js";
import { blockToJson, GENESIS_HASH, getLastBlock } from "../../krist/blocks/index.js";
import { ReqQuery } from "../index.js";

export default (): Router => {
  const router = Router();

  // ===========================================================================
  // API v2
  // ===========================================================================
  router.post("/submit", async (req, res) => {
    try {
      const result = await ctrlSubmitBlock(req,
        req.body.address, req.body.nonce);

      res.json({
        ok: true,
        success: true,
        work: result.work,
        address: addressToJson(result.address),
        block: blockToJson(result.block)
      });
    } catch (err: unknown) {
      // Catch incorrect solution errors and be sure that `ok` is `true` and
      // `success` is `false`
      if (err instanceof ErrorSolutionIncorrect
        || err instanceof ErrorSolutionDuplicate) {
        res.json({
          ok: true,
          success: false,
          error: err.errorString || "unknown_error"
        });
      } else {
        throw err;
      }
    }
  });

  // ===========================================================================
  // Legacy API
  // ===========================================================================
  router.get("/", async (req: ReqQuery<{
    submitblock?: string;
    address?: string;
    nonce?: string;
  }>, res, next) => {
    if (req.query.submitblock !== undefined) {
      const { address, nonce } = req.query;

      try {
        await ctrlSubmitBlock(req, address, nonce);
        res.send("Block solved");
      } catch (err: unknown) {
        if (err instanceof KristError) {
          // Convert v2 errors to legacy API errors
          if (err.errorString === "mining_disabled")
            return res.send("Mining disabled");

          if (err instanceof ErrorInvalidParameter) {
            if (err.parameter === "address")
              return res.send("Invalid address");
            if (err.parameter === "nonce")
              return res.send("Nonce is too large");
          }

          if (err.errorString === "solution_duplicate")
            return res.send("Solution rejected");

          if (err.errorString === "solution_incorrect") {
            // v1 API returns address + lastBlockHash + nonce for invalid
            // solutions, not sure why
            const lastBlock = await getLastBlock();
            if (!lastBlock) return res.send("Mining disabled");
            return res.send(address + (lastBlock.hash ?? GENESIS_HASH).substring(0, 12) + nonce);
          }
        }

        console.error(err);
        return res.send("Unknown error");
      }

      return;
    }

    next();
  });

  return router;
};
