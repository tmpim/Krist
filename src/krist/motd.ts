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

import packageJson from "../../package.json" with { type: "json" };
import { redis, rKey } from "../database/redis.js";
import {
  MAX_WORK,
  MIN_WORK,
  NAME_COST,
  NONCE_MAX_SIZE,
  PUBLIC_URL,
  PUBLIC_WS_URL,
  SECONDS_PER_BLOCK,
  WALLET_VERSION,
  WORK_FACTOR
} from "../utils/vars.js";
import { BlockJson, blockToJson, getLastBlock } from "./blocks/index.js";
import { areTransactionsEnabled, isMiningEnabled } from "./switches.js";
import { getWork } from "./work.js";

export interface Motd {
  motd: string;
  motd_set: string | null;
  debug_mode: boolean;
}

export interface DetailedMotd {
  server_time: string;

  motd: string;
  set: string | null; // support for backwards compatibility
  motd_set: string | null;

  public_url: string;
  public_ws_url: string;
  mining_enabled: boolean;
  transactions_enabled: boolean;
  debug_mode: boolean;

  work: number;
  last_block: BlockJson | null;

  package: {
    name: string;
    version: string;
    author: string;
    licence: string;
    repository: string;
  };

  constants: {
    wallet_version: number;
    nonce_max_size: number;
    name_cost: number;
    min_work: number;
    max_work: number;
    work_factor: number;
    seconds_per_block: number;
  };

  currency: {
    address_prefix: string;
    name_suffix: string;

    currency_name: string;
    currency_symbol: string;
  };

  notice: string;
}

export async function getMotd(): Promise<Motd> {
  const motd = await redis.get(rKey("motd")) || "Welcome to Krist!";
  const rawDate = await redis.get(rKey("motd:date"));
  const date = typeof rawDate === "string" ? new Date(rawDate) : new Date(0);

  return {
    motd,
    motd_set: date.toISOString(),
    debug_mode: process.env.NODE_ENV !== "production"
  };
}

export async function getDetailedMotd(): Promise<DetailedMotd> {
  const { motd, motd_set, debug_mode } = await getMotd();
  const lastBlock = await getLastBlock();

  return {
    server_time: new Date().toISOString(),

    motd,
    set: motd_set, // support for backwards compatibility
    motd_set,

    public_url: PUBLIC_URL,
    public_ws_url: PUBLIC_WS_URL,
    mining_enabled: await isMiningEnabled(),
    transactions_enabled: await areTransactionsEnabled(),
    debug_mode,

    work: await getWork(),
    last_block: lastBlock ? blockToJson(lastBlock) : null,

    package: {
      name: packageJson.name,
      version: packageJson.version,
      author: packageJson.author,
      licence: packageJson.license,
      repository: packageJson.repository.url
    },

    constants: {
      wallet_version: WALLET_VERSION,
      nonce_max_size: NONCE_MAX_SIZE,
      name_cost: NAME_COST,
      min_work: MIN_WORK,
      max_work: MAX_WORK,
      work_factor: WORK_FACTOR,
      seconds_per_block: SECONDS_PER_BLOCK
    },

    currency: {
      address_prefix: "k",
      name_suffix: "kst",

      currency_name: "Krist",
      currency_symbol: "KST"
    },

    // NOTE: It is against the license to modify this string on a fork node
    notice: "Krist was originally created by 3d6 and Lemmmy. It is now owned"
          + " and operated by tmpim, and licensed under GPL-3.0."
  };
}
