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

import chalkT from "chalk-template";
import { createClient } from "redis";

import { REDIS_HOST, REDIS_PASS, REDIS_PORT, REDIS_PREFIX } from "../utils/vars.js";

export const redis = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
  },
  password: REDIS_PASS
});

redis.on("ready", () =>
  console.log(chalkT`{green [Redis]} Connected`));
redis.on("error", (err: Error) =>
  console.error(chalkT`{red [Redis]} Error:`, err));
redis.on("end", () =>
  console.error(chalkT`{red [Redis]} Disconnected`));
redis.on("reconnecting", () =>
  console.error(chalkT`{cyan [Redis]} Reconnecting`));

export async function initRedis(): Promise<void> {
  console.log(chalkT`{cyan [Redis]} Connecting to redis`);
  await redis.connect();
  await redis.ping();
}

export async function shutdownRedis(): Promise<void> {
  console.log(chalkT`{cyan [Redis]} Disconnecting from redis`);
  await redis.disconnect();
  console.log(chalkT`{green [Redis]} Disconnected`);
}

export const rKey = (key: string): string => `${REDIS_PREFIX}${key}`;
