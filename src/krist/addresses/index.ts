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

import { QueryTypes } from "@sequelize/core";
import { Address, db, Limit, Offset, PaginatedResult } from "../../database/index.js";
import { sanitiseLimit, sanitiseOffset } from "../../utils/index.js";

export interface AddressWithNames extends Address {
  names?: number;
}

export async function getAddress(
  address: string,
  fetchNames?: boolean
): Promise<AddressWithNames | null> {
  if (fetchNames) {
    // Fetch the name count if requested
    const rows = await db.query<Address>(`
      SELECT
        \`addresses\`.*,
        COUNT(\`names\`.\`id\`) AS \`names\`
      FROM \`addresses\`
      LEFT JOIN \`names\` ON \`addresses\`.\`address\` = \`names\`.\`owner\`
      WHERE \`addresses\`.\`address\` = :address
      LIMIT 1
    `, {
      // model: Address, // does properly map dates, but doesn't properly include the name count
      // mapToModel: true,
      replacements: { address },
      type: QueryTypes.SELECT
    });

    const result: AddressWithNames | null = rows && rows.length ? rows[0] : null;
    if (result) {
      result.firstseen = new Date(result.firstseen); // convert string to Date
      result.names = Number(result.names); // convert string to number
    }
    return result;
  } else {
    // Perform the regular lookup
    return Address.findOne({ where: { address } });
  }
}

export async function getAddresses(
  limit?: Limit,
  offset?: Offset
): Promise<PaginatedResult<Address>> {
  return Address.findAndCountAll({
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export async function getRichAddresses(
  limit?: Limit,
  offset?: Offset
): Promise<PaginatedResult<Address>> {
  return Address.findAndCountAll({
    order: [["balance", "DESC"]],
    limit: sanitiseLimit(limit),
    offset: sanitiseOffset(offset)
  });
}

export interface AddressJson {
  address: string;
  balance: number;
  totalin: number;
  totalout: number;
  firstseen: string;
  names?: number;
}

export function addressToJson(address: AddressWithNames): AddressJson {
  return {
    address: address.address.toLowerCase(),
    balance: address.balance,
    totalin: address.totalin,
    totalout: address.totalout,
    firstseen: address.firstseen.toISOString(),

    // Add the name count, but only if it was requested
    ...(address.names !== undefined
      ? { names: address.names }
      : {})
  };
}
