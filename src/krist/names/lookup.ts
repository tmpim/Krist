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

import { InferAttributes, Op, sql } from "@sequelize/core";
import { Limit, Name, Offset, PaginatedResult } from "../../database/index.js";
import { sanitiseLimit, sanitiseOffset } from "../../utils/index.js";

export async function lookupNames(
  addressList: string[] | undefined,
  limit: Limit,
  offset: Offset,
  orderBy: (keyof InferAttributes<Name>) | "transferredOrRegistered" = "name",
  order: "ASC" | "DESC" = "ASC"
): Promise<PaginatedResult<Name>> {
  return Name.findAndCountAll({
    order: [[
      // Ordering by `transferred` can return null results and may not be the desirable ordering for the user, so
      // `transferredOrRegistered` is an alternative option that falls back to `registered` if `transferred` is null.
      orderBy === "transferredOrRegistered"
        ? sql`COALESCE(transferred, registered)`
        : orderBy,
      order
    ]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset),
    where: addressList ? { owner: {[Op.in]: addressList} } : undefined,
  });
}
