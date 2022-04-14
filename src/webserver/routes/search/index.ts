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

import { Router } from "express";
import rateLimit from "express-rate-limit";

import { LookupQuery } from "../lookup";

import { AddressJson } from "../../../krist/addresses";
import { BlockJson } from "../../../krist/blocks";
import { NameJson } from "../../../krist/names";
import { TransactionJson } from "../../../krist/transactions";

import { TEST } from "../../../utils/constants";

import routerSearchBasic from "./search";
import routerSearchExtended from "./searchExtended";

export type ReqSearchQuery = LookupQuery<{
  q?: string;
  includeMined?: boolean;
}>;

/**
 * @apiDefine SearchQuery
 *
 * @apiSuccess {Object} query Information about the way the search query was
 *   interpreted.
 * @apiSuccess {String} query.originalQuery The original (sanitised) query
 *   text.
 * @apiSuccess {Boolean} query.matchAddress Whether or not the query exactly
 *   matches the format of a Krist address.
 * @apiSuccess {Boolean} query.matchName Whether or not the query exactly
 *   matches the format of a Krist name (with or without the `.kst`) suffix.
 * @apiSuccess {Boolean} query.matchBlock Whether or not the query exactly
 *   matches the format of a block ID (with all non-numbers removed).
 * @apiSuccess {Boolean} query.matchTransaction Whether or not the query
 *   exactly matches the format of a transaction ID (with all non-numbers
 *   removed).
 * @apiSuccess {String} query.strippedName The query with the `.kst` suffix
 *   stripped, if it was present.
 * @apiSuccess {Boolean} query.hasID Whether or not the query looks like an ID
 *   number (e.g. for blocks or transactions).
 * @apiSuccess {Number} [query.cleanID] If hasID is true, this is the query,
 *   sanitised and converted to a number.
 */
export interface SearchQueryMatch {
  originalQuery: string;

  matchAddress: boolean;
  matchBlock: boolean;
  matchName: boolean;
  matchTransaction: boolean;

  strippedName: string;

  hasID: boolean;
  cleanID?: number;
}

export interface SearchResult {
  query: SearchQueryMatch;

  matches: {
    exactAddress: AddressJson | false;
    exactBlock: BlockJson | false;
    exactName: NameJson | false;
    exactTransaction: TransactionJson | false;
  };
}

export interface SearchExtendedResult {
  query: SearchQueryMatch;

  matches: {
    transactions: {
      addressInvolved: number | false;
      nameInvolved: number | false;
      metadata: number | false;
    };
  };
}

export default (): Router => {
  const router = Router();

  if (!TEST) {
    router.use(rateLimit({
      windowMs: 10000, max: 40,
      message: { ok: false, error: "rate_limit_hit" },

      // Rate limit each route individually
      keyGenerator: (req) => `${req.ip}/${req.route}`
    }));
  }

  router.use(routerSearchBasic());
  router.use(routerSearchExtended());

  return router;
};

export * from "./utils";
