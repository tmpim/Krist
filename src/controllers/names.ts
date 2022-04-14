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

import { Request } from "express";
import { db, Limit, Name, Offset, PaginatedResult } from "../database";
import {
  ErrorAddressNotFound, ErrorAuthFailed, ErrorInsufficientFunds,
  ErrorInvalidParameter, ErrorMissingParameter, ErrorNameNotFound,
  ErrorNameTaken, ErrorNotNameOwner
} from "../errors";
import { getAddress } from "../krist/addresses";
import { verifyAddress } from "../krist/addresses/verify";

import {
  createName, getName, getNames, getNamesByAddress, getUnpaidNames
} from "../krist/names";
import { createTransaction, pushTransaction } from "../krist/transactions/create";

import {
  getReqDetails, isValidARecord, isValidKristAddress, isValidName, validateLimitOffset
} from "../utils";
import { NAME_COST } from "../utils/constants";

function cleanNameInput(name: string): string {
  return name.trim().toLowerCase();
}

export async function ctrlGetNames(
  limit: Limit,
  offset: Offset
): Promise<PaginatedResult<Name>> {
  await validateLimitOffset(limit, offset);
  return getNames(limit, offset);
}

export async function ctrlGetName(
  name: string | undefined
): Promise<Name> {
  if (!name) throw new ErrorMissingParameter("name");
  if (!isValidName(name, true)) throw new ErrorInvalidParameter("name");
  name = cleanNameInput(name);

  const dbName = await getName(name);
  if (!dbName) throw new ErrorNameNotFound(name);
  return dbName;
}

export async function ctrlCheckName(
  name: string | undefined
): Promise<boolean> {
  if (!name) throw new ErrorMissingParameter("name");
  if (!isValidName(name, true)) throw new ErrorInvalidParameter("name");
  name = cleanNameInput(name);

  const dbName = await getName(name);
  return !dbName;
}

export async function ctrlGetUnpaidNames(
  limit: Limit,
  offset: Offset
): Promise<PaginatedResult<Name>> {
  await validateLimitOffset(limit, offset);
  return getUnpaidNames(limit, offset);
}

export async function ctrlGetNamesByAddress(
  address: string | undefined,
  limit: Limit,
  offset: Offset
): Promise<PaginatedResult<Name>> {
  if (!address) throw new ErrorMissingParameter("address");
  if (!isValidKristAddress(address)) throw new ErrorInvalidParameter("address");

  await validateLimitOffset(limit, offset);

  const kristAddress = await getAddress(address);
  if (!kristAddress) throw new ErrorAddressNotFound(address);

  return getNamesByAddress(kristAddress.address, limit, offset);
}

export async function ctrlRegisterName(
  req: Request,
  desiredName?: string,
  privatekey?: string
): Promise<Name> {
  const { userAgent, origin } = getReqDetails(req);

  // Input validation
  if (!desiredName) throw new ErrorMissingParameter("name");
  if (!privatekey) throw new ErrorMissingParameter("privatekey");

  if (!desiredName) throw new ErrorMissingParameter("name");
  if (!isValidName(desiredName)) throw new ErrorInvalidParameter("name");

  // Convert to lowercase
  const finalName = cleanNameInput(desiredName);

  // Address auth validation
  const { authed, address: dbAddress } = await verifyAddress(req, privatekey);
  if (!authed) throw new ErrorAuthFailed();

  // Check if the name already exists
  if (await getName(finalName)) throw new ErrorNameTaken(finalName);

  // Reject insufficient funds
  if (dbAddress.balance < NAME_COST) throw new ErrorInsufficientFunds();

  return await db.transaction(async t => {
    // Do these actions in parallel
    const [,,, dbName] = await Promise.all([
      // Decrease the purchaser's balance and increase their totalout
      dbAddress.decrement({ balance: NAME_COST }, { transaction: t }),
      dbAddress.increment({ totalout: NAME_COST }, { transaction: t }),

      // Create the name transaction
      createTransaction(
        "name",
        dbAddress.address,
        NAME_COST,
        finalName,
        null,
        t,
        userAgent,
        origin
      ),

      // Create the name itself
      createName(finalName, dbAddress.address, t)
    ]);

    // Return the new name
    return dbName;
  });
}

export async function ctrlTransferName(
  req: Request,
  name?: string,
  privatekey?: string,
  address?: string
): Promise<Name> {
  const { userAgent, origin } = getReqDetails(req);

  // Input validation
  if (!name) throw new ErrorMissingParameter("name");
  if (!privatekey) throw new ErrorMissingParameter("privatekey");
  if (!address) throw new ErrorMissingParameter("address");

  if (!isValidName(name)) throw new ErrorInvalidParameter("name");
  if (!isValidKristAddress(address, true))
    throw new ErrorInvalidParameter("address");

  name = cleanNameInput(name);

  // Address auth validation
  const { authed, address: dbAddress } = await verifyAddress(req, privatekey);
  if (!authed) throw new ErrorAuthFailed();

  // Get the name from the database
  const dbName = await getName(name);
  if (!dbName) throw new ErrorNameNotFound(name);
  if (dbName.owner !== dbAddress.address) throw new ErrorNotNameOwner(name);

  // Disallow "bumping" names, don't change anything and respond as usual
  if (dbName.owner === address) return dbName;

  const date = new Date();

  await db.transaction(async t => {
    // Do these actions in parallel
    await Promise.all([
      // Update the name's owner and transferred date
      // NOTE: original_owner is only updated if it was previously null. There's
      //       only a small number of names that the original owner couldn't be
      //       found for.
      dbName.update({
        owner: address,
        updated: date,
        transferred: date,

        // If the name did not have an original owner for some reason, use the
        // current owner.
        ...(dbName.original_owner ? {} : { original_owner: dbName.owner })
      }, { transaction: t }),

      // Add a name meta transaction
      pushTransaction(
        dbAddress,
        address,
        0,
        null,
        dbName.name,
        t,
        userAgent,
        origin
      )
    ]);
  });

  // Return the updated name
  return dbName.reload();
}

export async function ctrlUpdateName(
  req: Request,
  name?: string,
  privatekey?: string,
  a?: string | null
): Promise<Name> {
  const { userAgent, origin } = getReqDetails(req);

  // Clean name data
  if (typeof a === "string") a = a.trim();
  if (a === undefined || a === "") a = null;

  // Input validation
  if (!name) throw new ErrorMissingParameter("name");
  if (!privatekey) throw new ErrorMissingParameter("privatekey");

  if (!isValidName(name))
    throw new ErrorInvalidParameter("name");
  if (a !== null && !isValidARecord(a))
    throw new ErrorInvalidParameter("a");

  name = cleanNameInput(name);

  // Address auth validation
  const { authed, address: dbAddress } = await verifyAddress(req, privatekey);
  if (!authed) throw new ErrorAuthFailed();

  // Get the name from the database
  const dbName = await getName(name);
  if (!dbName) throw new ErrorNameNotFound(name);
  if (dbName.owner !== dbAddress.address) throw new ErrorNotNameOwner(name);

  // Disallow "bumping" names, don't change anything and respond as usual
  if (dbName.a === a) return dbName;

  await db.transaction(async t => {
    // Do these actions in parallel
    await Promise.all([
      // Update the name's data
      dbName.update({
        a,
        updated: new Date()
      }, { transaction: t }),

      // Add a name meta transaction
      createTransaction(
        "a",
        dbName.owner,
        0,
        dbName.name,
        a,
        t,
        userAgent,
        origin
      )
    ]);
  });

  // Return the updated name
  return dbName.reload();
}
