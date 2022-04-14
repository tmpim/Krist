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

import { db, Limit, Offset } from "../database";

import { ErrorInvalidParameter } from "../errors";

import { isNaN } from "lodash";
import { Literal } from "sequelize/types/utils";

/**
 * @apiDefine Limit
 * @apiQuery {Number{1-1000}} [limit=50] The maximum amount of results to
 *   return. Must be between 1 and 1000.
 */

/**
 * @apiDefine Offset
 * @apiQuery {Number} [offset=0] The amount to offset the results, useful to
 *   paginate results, and in conjunction with `limit`.
 */

/**
 * @apiDefine LimitOffset
 * @apiUse Limit
 * @apiUse Offset
 */

export async function validateLimit(limit: Limit): Promise<void> {
  if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
    throw new ErrorInvalidParameter("limit");
  }
}

export async function validateOffset(offset: Offset): Promise<void> {
  if ((offset && isNaN(offset)) || (offset && offset < 0)) {
    throw new ErrorInvalidParameter("offset");
  }
}

export async function validateLimitOffset(
  limit: Limit,
  offset: Offset
): Promise<void> {
  await validateLimit(limit);
  await validateOffset(offset);
}

export function sanitiseLimit(
  limit: Limit,
  def = 50,
  max = 1000
): number {
  if (
    limit === undefined
    || limit === null
    || limit === ""
    || (typeof limit === "string" && limit.trim() === "")
    || isNaN(parseInt(limit as string))
  ) {
    return def;
  }

  const limitNumber = typeof limit === "string" ? parseInt(limit) : limit;

  return Math.min(
    limitNumber < 0 ? def : limitNumber,
    max
  );
}

export function sanitiseOffset(
  offset: Offset
): number | undefined {
  if (!offset) return undefined;
  return typeof offset === "string" ? parseInt(offset) : offset;
}

export function sanitiseLike(query?: string | null): Literal {
  if (!query || typeof query !== "string")
    throw new Error("invalid like");

  const inputRaw = query.replace(/([_%\\])/g, "\\$1");
  const inputEscaped = db.escape(`%${inputRaw}%`);
  return db.literal(inputEscaped);
}

export function sanitiseUserAgent(
  userAgent?: string | null
): string | undefined {
  if (!userAgent || typeof userAgent !== "string") return;
  if (userAgent.length > 255) return userAgent.substring(0, 255);
  return userAgent;
}
export const sanitiseOrigin = sanitiseUserAgent;
