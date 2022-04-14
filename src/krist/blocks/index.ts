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

import {
  Block, PaginatedResult, Limit, Offset, SqTransaction
} from "../../database";
import { Op } from "sequelize";

import { getUnpaidNameCount } from "../names";

import {
  getBaseBlockValue, getLegacyWork, sanitiseLimit, sanitiseOffset
} from "../../utils";

export async function getBlock(id: number): Promise<Block | null> {
  return Block.findByPk(id);
}

export async function getBlocks(
  limit?: Limit,
  offset?: Offset,
  asc?: boolean
): Promise<PaginatedResult<Block>> {
  return Block.findAndCountAll({
    order: [["id", asc ? "ASC" : "DESC"]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export async function getLastBlock(
  dbTx?: SqTransaction
): Promise<Block | null> {
  return Block.findOne({
    order: [["id","DESC"]],
    transaction: dbTx
  });
}

export async function getLowestHashes(
  limit?: Limit,
  offset?: Offset
): Promise<PaginatedResult<Block>> {
  return Block.findAndCountAll({
    where: {
      [Op.and]: [
        { hash: { [Op.not]: null } },
        { id: { [Op.gt]: 10 } } // Ignore the genesis block
      ]
    },
    order: [["hash", "ASC"]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export async function getBlockValue(dbTx?: SqTransaction): Promise<number> {
  const lastBlock = await getLastBlock(dbTx);
  const unpaidNames = await getUnpaidNameCount(dbTx);
  return getBaseBlockValue(lastBlock?.id ?? 1) + unpaidNames;
}

export interface BlockJson {
  height: number;
  address: string;
  hash: string | null;
  short_hash: string | null;
  value: number;
  time: string;
  difficulty: number;
}

export function blockToJson(block: Block): BlockJson {
  return {
    height: block.id,
    address: block.address,
    hash: block.hash,
    short_hash: block.hash ? block.hash.substring(0, 12) : null,
    value: block.value,
    time: block.time.toISOString(),
    difficulty: getLegacyWork(block.id) ?? block.difficulty
  };
}
