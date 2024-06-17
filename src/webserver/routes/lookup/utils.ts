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

import { Limit, Offset } from "../../../database/index.js";
import { ErrorInvalidParameter } from "../../../errors/index.js";
import { isValidKristAddressList } from "../../../utils/index.js";
import { ADDRESS_LIST_LIMIT } from "./index.js";

/** Validate a comma-separated list of addresses, returning an array of them
 * if it is valid, or throwing an error if it is not. */
export function validateAddressList(
  addressList: string
): string[] {
  // If it doesn't match the address list regex, error
  if (!isValidKristAddressList(addressList))
    throw new ErrorInvalidParameter("addresses");

  // Deserialize, clean up, and deduplicate address list
  const addresses = [...new Set(addressList.trim().toLowerCase().split(","))];

  // Check that they didn't supply too many addresses
  if (addresses.length > ADDRESS_LIST_LIMIT)
    throw new ErrorInvalidParameter("addresses");

  return addresses;
}

export function validateOrderBy<T extends string>(
  validFields: T[],
  order?: string
): T | undefined {
  // Ignore unsupplied parameter
  if (order === undefined) return;

  if (typeof order !== "string" || !validFields.includes(order as T))
    throw new ErrorInvalidParameter("orderBy");

  return order as T;
}

export function validateOrder(order?: string): "ASC" | "DESC" | undefined {
  // Ignore unsupplied parameter
  if (order === undefined) return "ASC";

  if (typeof order !== "string"
  || (order.toUpperCase() !== "ASC" && order.toUpperCase() !== "DESC"))
    throw new ErrorInvalidParameter("order");

  return order.toUpperCase() as "ASC" | "DESC";
}

export function validateLimit(limit: Limit): number | undefined {
  // Ignore unsupplied parameter
  if (limit === undefined || limit === null) return;

  // Convert to int
  limit = typeof limit === "string" ? parseInt(limit) : limit;

  // Validate range
  if (isNaN(limit) || (limit && limit <= 0))
    throw new ErrorInvalidParameter("limit");

  return limit;
}

export function validateOffset(offset: Offset): number | undefined {
  // Ignore unsupplied parameter
  if (offset === undefined || offset === null) return;

  // Convert to int
  offset = typeof offset === "string" ? parseInt(offset) : offset;

  // Validate range
  if (isNaN(offset) || (offset && offset <= 0))
    throw new ErrorInvalidParameter("offset");

  return offset;
}
