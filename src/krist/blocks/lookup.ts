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

import { Limit, Offset, Block, PaginatedResult, db } from "../../database";
import { InferAttributes, Order } from "sequelize";

import { sanitiseLimit, sanitiseOffset } from "../../utils";

export async function lookupBlocks(
  limit: Limit,
  offset: Offset,
  orderBy: keyof InferAttributes<Block> = "id",
  order: "ASC" | "DESC" = "DESC"
): Promise<PaginatedResult<Block>> {
  // This is a hack, but during 2020-03 to 2020-07, there were block hashes lost
  // due to a database reconstruction. They are currently marked as NULL in the
  // database. In Blocks.getLowestHashes, null hashes are ignored, but here,
  // they are still returned. As such, this pushes the nulls to the end of the
  // result set if sorting by hash ascending.
  const dbOrder: Order = orderBy === "hash" && order === "ASC"
    ? [db.fn("isnull", db.col("hash")), ["hash", "ASC"]]
    : [[orderBy, order]];

  return Block.findAndCountAll({
    order: dbOrder,
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset),
  });
}
