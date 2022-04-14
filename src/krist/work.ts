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

import { redis, rKey } from "../database/redis";
import { MAX_WORK } from "../utils/constants";

export async function getWork(): Promise<number> {
  const rawWork = await redis.get(rKey("work"));
  return rawWork ? parseInt(rawWork) : MAX_WORK;
}

export async function getWorkOverTime(): Promise<number[]> {
  return (await redis.lRange(rKey("work-over-time"), 0, 1440))
    .map(i => parseInt(i))
    .reverse();
}

export async function setWork(work: number): Promise<void> {
  await redis.set(rKey("work"), work.toString());
}

let workOverTimeInterval: NodeJS.Timer;
export function initWorkOverTime(): void {
  // Update the work over time every minute
  workOverTimeInterval = setInterval(async () => {
    await redis.lPush(rKey("work-over-time"), (await getWork()).toString());
    await redis.lTrim(rKey("work-over-time"), 0, 1440);
  }, 60 * 1000);
}
export function teardownWorkOverTime(): void {
  clearInterval(workOverTimeInterval);
}
