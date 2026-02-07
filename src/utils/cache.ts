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

import crypto from "crypto";
import { CountOptions, FindAndCountOptions, Model, ModelStatic, Op } from "@sequelize/core";
import { redis, rKey } from "../database/redis.js";
import { PaginatedResult } from "../database/index.js";

const CACHE_TTL = 15 * 60;

function symbolKeyToString(sym: symbol): string {
  // Try to match known Sequelize Op symbols
  for (const [name, opSym] of Object.entries(Op)) {
    if (opSym === sym) return `[$${name}]`; // e.g. [$and], [$in]
  }

  // Fallback: Symbol(and) -> [Symbol(and)]
  return `[${String(sym)}]`;
}

function toJsonSafe(value: any): any {
  if (value === null || typeof value !== "object") {
    if (typeof value === "symbol") return symbolKeyToString(value);
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toJsonSafe);
  }

  if ("val" in value && typeof (value as any).val !== "undefined") {
    return String((value as any).val);
  }

  // Copy ALL own keys: string keys + symbol keys
  const out: Record<string, any> = {};

  // string keys
  for (const key of Object.keys(value).sort()) {
    out[key] = toJsonSafe(value[key]);
  }

  // symbol keys
  const syms = Object.getOwnPropertySymbols(value).sort((a, b) =>
    symbolKeyToString(a).localeCompare(symbolKeyToString(b)),
  );

  for (const sym of syms) {
    out[symbolKeyToString(sym)] = toJsonSafe(value[sym]);
  }

  return out;
}

function hashQueryOptions<M extends Model>(options: FindAndCountOptions<M>): string {
  // Remove the unconcerned keys 'order', 'limit', 'offset' from the query
  const { order, limit, offset, ...query } = options;

  const safe = toJsonSafe(query);
  const queryString = JSON.stringify(safe);
  const hash = crypto.createHash("sha256").update(queryString).digest("hex");
  return hash;
}

function getCacheKey<M extends Model>(prefix: string, options: CountOptions<M> | FindAndCountOptions<M>): string {
  const hash = hashQueryOptions(options);
  return rKey(`${prefix}:count:${hash}`);
}

export async function cachedCount<M extends Model>(
  model: ModelStatic<M>,
  options: CountOptions<M>,
  cachePrefix: string = model.name
): Promise<number> {
  ensureAutomaticInvalidation(cachePrefix);
  const cacheKey = getCacheKey(cachePrefix, options);

  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached, 10);
    }
  } catch (err) {
    console.error(`[${cachePrefix} Cache] Error getting cached count:`, err);
  }

  const count = await model.count(options);

  try {
    await redis.setEx(cacheKey, CACHE_TTL, count.toString());
  } catch (err) {
    console.error(`[${cachePrefix} Cache] Error setting cached count:`, err);
  }

  return count;
}

export async function cachedFindAndCountAll<M extends Model>(
  model: ModelStatic<M>,
  options: FindAndCountOptions<M>,
  cachePrefix: string = model.name
): Promise<PaginatedResult<M>> {
  ensureAutomaticInvalidation(cachePrefix);
  const countOptions = { where: options.where };
  const cacheKey = getCacheKey(cachePrefix, countOptions);

  let count: number;
  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      count = parseInt(cached, 10);
      const rows = await model.findAll(options);
      return { rows, count };
    }
  } catch (err) {
    console.error(`[${cachePrefix} Cache] Error getting cached count:`, err);
  }

  const result = await model.findAndCountAll(options);

  try {
    await redis.setEx(cacheKey, CACHE_TTL, result.count.toString());
  } catch (err) {
    console.error(`[${cachePrefix} Cache] Error setting cached count:`, err);
  }

  return result;
}

export async function invalidateCountCache(cachePrefix: string): Promise<void> {
  try {
    const pattern = rKey(`${cachePrefix}:count:*`);
    const keysToDelete: string[] = [];

    let cursor = 0;
    do {
      const result = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });

      cursor = result.cursor;
      keysToDelete.push(...result.keys);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
  } catch (err) {
    console.error(`[${cachePrefix} Cache] Error invalidating cache:`, err);
  }
}

const invalidationIntervals = new Map<string, NodeJS.Timeout>();

function ensureAutomaticInvalidation(cachePrefix: string): void {
  if (invalidationIntervals.has(cachePrefix)) {
    return;
  }

  console.log(`[Cache] Starting automatic invalidation for prefix: ${cachePrefix} (every ${CACHE_TTL / 60} minutes)`);

  const interval = setInterval(async () => {
    await invalidateCountCache(cachePrefix);
  }, CACHE_TTL * 1000);

  invalidationIntervals.set(cachePrefix, interval);
}

export function startAutomaticCacheInvalidation(cachePrefix: string): void {
  const existing = invalidationIntervals.get(cachePrefix);
  if (existing) {
    clearInterval(existing);
  }

  const interval = setInterval(async () => {
    await invalidateCountCache(cachePrefix);
  }, CACHE_TTL * 1000);

  invalidationIntervals.set(cachePrefix, interval);
}

export function stopAutomaticCacheInvalidation(cachePrefix: string): void {
  const interval = invalidationIntervals.get(cachePrefix);
  if (interval) {
    clearInterval(interval);
    invalidationIntervals.delete(cachePrefix);
  }
}

export function stopAllAutomaticCacheInvalidation(): void {
  for (const interval of invalidationIntervals.values()) {
    clearInterval(interval);
  }
  invalidationIntervals.clear();
}
