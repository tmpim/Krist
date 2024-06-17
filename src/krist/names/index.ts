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

import { Op, QueryTypes, sql } from "@sequelize/core";

import promClient from "prom-client";
import { db, Limit, Name, Offset, PaginatedResult, SqTransaction } from "../../database/index.js";

import { sanitiseLimit, sanitiseOffset } from "../../utils/index.js";
import { NAME_COST } from "../../utils/vars.js";

import { wsManager } from "../../websockets/index.js";

const promNamesPurchasedCounter = new promClient.Counter({
  name: "krist_names_purchased_total",
  help: "Total number of purchased since the Krist server first started."
});

export async function getNames(
  limit?: Limit,
  offset?: Offset
): Promise<PaginatedResult<Name>> {
  return Name.findAndCountAll({
    order: [["name", "ASC"]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export async function getNamesByAddress(
  address: string,
  limit?: Limit,
  offset?: Offset
): Promise<PaginatedResult<Name>> {
  return Name.findAndCountAll({
    order: [["name", "ASC"]],
    where: { owner: address },
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export interface DetailedUnpaidResponseRow {
  count: number;
  unpaid: number;
}

export async function getDetailedUnpaid(): Promise<DetailedUnpaidResponseRow[]> {
  return db.query(sql`
    SELECT COUNT(*) AS \`count\`, \`unpaid\` FROM \`names\`
    GROUP BY \`unpaid\`
    ORDER BY \`unpaid\`;
  `, { type: QueryTypes.SELECT });
}

export async function getNameCountByAddress(address: string): Promise<number> {
  return Name.count({ where: { owner: address }});
}

export async function getName(name: string): Promise<Name | null> {
  return Name.findOne({ where: { name }});
}

export async function getUnpaidNames(
  limit?: Limit,
  offset?: Offset
): Promise<PaginatedResult<Name>> {
  return Name.findAndCountAll({
    order: [["id", "DESC"]],
    where: { unpaid: { [Op.gt]: 0 }},
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export async function getUnpaidNameCount(
  dbTx?: SqTransaction
): Promise<number> {
  return Name.count({
    where: { unpaid: { [Op.gt]: 0 }},
    transaction: dbTx
  });
}

export async function createName(
  name: string,
  owner: string,
  dbTx: SqTransaction
): Promise<Name> {
  const dbName = await Name.create({
    name,
    owner,
    original_owner: owner,
    registered: new Date(),
    updated: new Date(),
    transferred: null,
    unpaid: NAME_COST
  }, { transaction: dbTx });

  promNamesPurchasedCounter.inc();

  wsManager.broadcastEvent({
    type: "event",
    event: "name",
    name: nameToJson(dbName)
  });

  return dbName;
}

export interface NameJson {
  name: string;
  owner: string;
  original_owner: string | null;
  registered: string | null;
  updated: string | null;
  transferred: string | null;
  a: string | null;
  unpaid: number;
}

export function nameToJson(name: Name): NameJson {
  return {
    name: name.name,
    owner: name.owner,
    original_owner: name.original_owner ?? null,
    registered: name.registered ? name.registered.toISOString() : null,
    updated: name.updated ? name.updated.toISOString() : null,
    transferred: name.transferred ? name.transferred.toISOString() : null,
    a: name.a ?? null,
    unpaid: name.unpaid || 0
  };
}
