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

import { promisify } from "util";

import { RequestHandler } from "express";
import { OutgoingHttpHeaders } from "http2";

import { redis, rKey } from "../database/redis";
import { IDEMPOTENCY_TTL_SECS } from "../utils/constants";

const sleep = promisify(setTimeout);

export function idempotency(): RequestHandler {
  return async (req, res, next) => {
    const { method } = req;

    const rawKey = req.get("idempotency-key");
    if (!rawKey || typeof rawKey !== "string") return next();
    const key = rawKey.substring(0, 255);

    // Don't cache requests that are already idempotent
    if (method === "GET" || method === "HEAD" || method === "OPTIONS"
      || method === "DELETE") { // Not PUT, we're not actually RESTful ;)
      res.set("X-Idempotency-State", "not-idempotent");
      return next();
    }

    // Check if we have cached a response, or have a pending response
    let cached = await getCachedRequest(key);
    if (!cached) {
      // Intercept the original res.send() method for an uncached request to
      // cache it when it comes in
      const send = res.send.bind(res);
      (res as any).send = async (body: any) => {
        await putCachedRequest(key, {
          pending: false,
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body
        });

        res.set("X-Idempotency-State", "cache-miss");
        send(body);
      };

      // Put an early entry in the cache to indicate that we have a pending
      // request for this key, in case another request for it comes through
      // while we're waiting for the original response
      await putCachedRequest(key, { pending: true });
      return next(); // And then evaluate the request as normal
    }

    // If there is already a pending request, wait for it to complete first
    while (cached && cached.pending) {
      cached = await getCachedRequest(key);
      await sleep(50);
    }
    if (!cached) throw new Error("Cached request lost"); // server_error

    const { statusCode, headers, body } = cached;
    if (statusCode !== undefined) res.status(statusCode); // Not actually used
    if (headers !== undefined) res.set(headers);
    res.set("X-Idempotency-State", "cache-hit");
    res.send(body);
  };
}

interface CachedRequest {
  pending    : boolean;
  statusCode?: number; // Not actually used in Krist but provided anyway
  headers?   : OutgoingHttpHeaders;
  body?      : string;
}

const cacheKey = (key: string) => rKey("idempotent-request:" + key);

async function getCachedRequest(
  key: string
): Promise<CachedRequest | undefined> {
  const cached = await redis.get(cacheKey(key));
  if (!cached) return;
  return JSON.parse(cached);
}

async function putCachedRequest(
  key: string, request: CachedRequest
): Promise<void> {
  const data = JSON.stringify(request);
  await redis.set(cacheKey(key), data, { EX: IDEMPOTENCY_TTL_SECS });
}
