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
import { redis, rKey } from "../database/redis.js";
import { LAST_BLOCK } from "../utils/vars.js";

const cutoff = dayjs(LAST_BLOCK);

export async function isMiningEnabled(): Promise<boolean> {
  if (dayjs().isAfter(cutoff)) return false;
  return (await redis.get(rKey("mining-enabled"))) === "true";
}

export async function areTransactionsEnabled(): Promise<boolean> {
  return (await redis.get(rKey("transactions-enabled"))) === "true";
}
