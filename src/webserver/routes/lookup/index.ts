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
import { ReqQuery } from "../..";

import routerLookupAddresses from "./addresses";
import routerLookupBlocks from "./blocks";
import routerLookupNames from "./names";
import routerLookupTransactions from "./transactions";

// Fair tradeoff between flexibility and parameter limitations
export const ADDRESS_LIST_LIMIT = 128;

// Valid fields to order block lookups by
export type BlockLookupFields = "height" | "address" | "hash" | "value" |
  "time" | "difficulty";
export const BLOCK_FIELDS: BlockLookupFields[] = ["height", "address", "hash",
  "value", "time", "difficulty"];
// Valid fields to order transaction lookups by
export type TransactionLookupFields = "id" | "from" | "to" | "value" | "time" |
  "sent_name" | "sent_metaname"
export const TRANSACTION_FIELDS: TransactionLookupFields[] = ["id", "from",
  "to", "value", "time", "sent_name", "sent_metaname"];
// Valid fields to order name lookups by
export type NameLookupFields = "name" | "owner" | "original_owner" |
  "registered" | "updated" | "transferred" | "transferredOrRegistered" | "a" |
  "unpaid";
export const NAME_FIELDS: NameLookupFields[] = ["name", "owner",
  "original_owner", "registered", "updated", "transferred",
  "transferredOrRegistered", "a", "unpaid"];

export type LookupQuery<T = unknown> = ReqQuery<{
  limit?: string;
  offset?: string;
  orderBy?: string;
  order?: string;
} & T>;

/**
 * @apiDefine LookupGroup Lookup API
 *
 * Advanced bulk lookup queries designed for KristWeb v2.
 *
 * **WARNING:** The Lookup API is in Beta, and is subject to change at any time
 * without warning.
 */
export default (): Router => {
  const router = Router();

  router.use(routerLookupAddresses());
  router.use(routerLookupBlocks());
  router.use(routerLookupNames());
  router.use(routerLookupTransactions());

  return router;
};

export * from "./utils";
