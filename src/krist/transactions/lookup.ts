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

import { Transaction, Limit, Offset, PaginatedResult } from "../../database";
import { InferAttributes, Op, WhereOptions } from "sequelize";

import { sanitiseLimit, sanitiseOffset, sanitiseLike } from "../../utils";
import { OP_EXCLUDE_MINED } from ".";

export async function lookupTransactions(
  addressList: string[] | undefined,
  limit: Limit,
  offset: Offset,
  orderBy: keyof InferAttributes<Transaction> = "id",
  order: "ASC" | "DESC" = "ASC",
  includeMined?: boolean
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    order: [[orderBy, order]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset),
    where: addressList
      ? (includeMined
        ? {[Op.or]: [
          { from: {[Op.in]: addressList} },
          { to: {[Op.in]: addressList} }
        ]}
        : {[Op.or]: [
          { from: {[Op.in]: addressList} },
          {
            from: OP_EXCLUDE_MINED,
            to: {[Op.in]: addressList}
          }
        ]})
      : includeMined ? {} : { from: OP_EXCLUDE_MINED }
  });
}

export async function lookupTransactionsToName(
  name: string,
  limit: Limit,
  offset: Offset,
  orderBy: keyof InferAttributes<Transaction> = "id",
  order: "ASC" | "DESC" = "ASC",
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    order: [[orderBy, order]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset),
    where: { sent_name: name }
  });
}

export async function lookupNameHistory(
  name: string,
  limit: Limit,
  offset: Offset,
  orderBy: keyof InferAttributes<Transaction> = "id",
  order: "ASC" | "DESC" = "ASC",
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    order: [[orderBy, order]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset),
    where: { name }
  });
}

function getWhereSearchByName(query: string): WhereOptions<Transaction> {
  return {
    [Op.or]: [
      { name: query },
      { sent_name: query }
    ]
  };
}

export async function countByName(query: string): Promise<number> {
  return Transaction.count({
    where: getWhereSearchByName(query)
  });
}

export async function searchByName(
  query: string,
  limit: Limit,
  offset: Offset,
  orderBy: keyof InferAttributes<Transaction> = "id",
  order: "ASC" | "DESC" = "ASC"
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    where: getWhereSearchByName(query),
    order: [[orderBy, order]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

function getWhereSearchByMetadata(query: string): WhereOptions<Transaction> {
  return {
    [Op.and]: [
      { op: { [Op.not]: null }},
      { op: { [Op.ne]: "" }},
      { op: { [Op.like]: sanitiseLike(query) }}
    ]
  };
}

export async function countMetadata(query: string): Promise<number> {
  return Transaction.count({
    where: getWhereSearchByMetadata(query)
  });
}

export async function searchMetadata(
  query: string,
  limit: Limit,
  offset: Offset,
  orderBy: keyof InferAttributes<Transaction> = "id",
  order: "ASC" | "DESC" = "ASC"
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    where: getWhereSearchByMetadata(query),
    order: [[orderBy, order]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}
