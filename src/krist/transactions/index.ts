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

import { Limit, Offset, PaginatedResult, Transaction } from "../../database";
import { InferAttributes, Op, WhereOptions } from "sequelize";

import { sanitiseLimit, sanitiseOffset } from "../../utils";

// Query operator to exclude mined transactions in the 'from' field
export const OP_EXCLUDE_MINED = {
  [Op.notIn]: ["", " "], // From field that isn't a blank string or a space
  [Op.not]: null // And is not null
};

export async function getTransaction(id: number): Promise<Transaction | null> {
  return Transaction.findByPk(id);
}

export async function getTransactions(
  limit?: Limit,
  offset?: Offset,
  asc?: boolean,
  includeMined?: boolean
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    order: [["id", asc ? "ASC" : "DESC"]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset),
    where: includeMined ? {} : { from: OP_EXCLUDE_MINED }
  });
}

export async function getRecentTransactions(
  limit?: Limit,
  offset?: Offset
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    order: [["id", "DESC"]],
    limit: sanitiseLimit(limit, 100),
    offset: sanitiseOffset(offset),
    where: { from: OP_EXCLUDE_MINED }
  });
}

function getWhereTransactionsByAddress(
  address: string,
  includeMined?: boolean
): WhereOptions<Transaction> {
  return includeMined
    // When including mined transactions, we only care if from or to is the
    // queried address:
    ? {[Op.or]: [{ from: address }, { to: address }]}
    // However, when we exclude mined transactions, we care about the
    // transactions from the queried address, or transactions to it from a
    // non-null sender (mined transactions):
    : {[Op.or]: [
      { // Transactions from this address
        from: address
      },
      { // Non-mined transactions to this address
        from: OP_EXCLUDE_MINED, // Non-blank from
        to: address
      }
    ]};
}

export async function countTransactionsByAddress(
  address: string,
  includeMined?: boolean
): Promise<number> {
  return Transaction.count({
    where: getWhereTransactionsByAddress(address, includeMined)
  });
}

export async function getTransactionsByAddress(
  address: string,
  limit?: Limit,
  offset?: Offset,
  includeMined?: boolean,
  orderBy: keyof InferAttributes<Transaction> = "id",
  order: "ASC" | "DESC" = "DESC"
): Promise<PaginatedResult<Transaction>> {
  return Transaction.findAndCountAll({
    where: getWhereTransactionsByAddress(address, includeMined),
    order: [[orderBy, order]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export type TransactionType = "unknown" | "mined" | "name_purchase"
  | "name_a_record" | "name_transfer" | "transfer";
export function identifyTransactionType(tx: Transaction): TransactionType {
  if (!tx) return "unknown";
  if (!tx.from) return "mined";

  if (tx.name) {
    if (tx.to === "name") return "name_purchase";
    else if (tx.to === "a") return "name_a_record";
    else return "name_transfer";
  }

  return "transfer";
}

export interface TransactionJson {
  id: number;
  from: string;
  to: string;
  value: number;
  time: string;
  name: string | null;
  metadata: string | null;
  sent_metaname: string | null;
  sent_name: string | null;
  type: TransactionType;
}

export function transactionToJson(transaction: Transaction): TransactionJson {
  return {
    id: transaction.id,
    from: transaction.from,
    to: transaction.to,
    value: transaction.value,
    time: transaction.time.toISOString(),
    name: transaction.name ?? null,
    metadata: transaction.op ?? null,
    sent_metaname: transaction.sent_metaname ?? null,
    sent_name: transaction.sent_name ?? null,
    type: identifyTransactionType(transaction)
  };
}
