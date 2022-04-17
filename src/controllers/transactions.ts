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

import { db, Limit, Offset, PaginatedResult, Transaction } from "../database";

import { getAddress } from "../krist/addresses";
import { verifyAddress } from "../krist/addresses/verify";
import {
  getTransaction, getTransactions, getTransactionsByAddress
} from "../krist/transactions";
import { pushTransaction } from "../krist/transactions/create";
import { getName } from "../krist/names";

import {
  ErrorAddressNotFound, ErrorAuthFailed, ErrorInsufficientFunds,
  ErrorInvalidParameter, ErrorMissingParameter, ErrorNameNotFound,
  ErrorTransactionNotFound
} from "../errors";

import {
  isValidKristAddress, METANAME_METADATA_RE, NAME_META_RE, validateLimitOffset
} from "../utils";

import { isNaN } from "lodash";

export async function ctrlGetTransactions(
  limit: Limit,
  offset: Offset,
  asc?: boolean,
  includeMined?: boolean
): Promise<PaginatedResult<Transaction>> {
  await validateLimitOffset(limit, offset);
  return getTransactions(limit, offset, asc, includeMined);
}

export async function ctrlGetTransactionsByAddress(
  address?: string,
  limit?: Limit,
  offset?: Offset,
  includeMined?: boolean
): Promise<PaginatedResult<Transaction>> {
  if (!address) throw new ErrorMissingParameter("address");
  if (!isValidKristAddress(address)) throw new ErrorInvalidParameter("address");

  await validateLimitOffset(limit, offset);

  const kristAddress = await getAddress(address);
  if (!kristAddress) throw new ErrorAddressNotFound(address);

  return getTransactionsByAddress(
    kristAddress.address, limit, offset, includeMined
  );
}

export async function ctrlGetTransaction(
  id?: string | number
): Promise<Transaction> {
  if (!id) throw new ErrorMissingParameter("id");
  if (isNaN(id)) throw new ErrorInvalidParameter("id");

  const transactionId = Math.max(
    typeof id === "string" ? parseInt(id) : id,
    0
  );

  const transaction = await getTransaction(transactionId);
  if (!transaction) throw new ErrorTransactionNotFound();
  return transaction;
}

export async function ctrlMakeTransaction(
  req: Request,
  privatekey?: string,
  recipient?: string,
  amount?: string | number,
  metadata?: string
): Promise<Transaction> {
  // Input validation
  if (!privatekey) throw new ErrorMissingParameter("privatekey");
  if (!recipient) throw new ErrorMissingParameter("to");
  if (!amount) throw new ErrorMissingParameter("amount");

  // Check if we're paying to a name
  const isName = NAME_META_RE.test(recipient.toLowerCase());
  // Handle the potential legacy behavior of manually paying to a name via the
  // transaction metadata
  const metadataIsName = metadata && METANAME_METADATA_RE.test(metadata);

  const nameInfo = isName
    ? NAME_META_RE.exec(recipient.toLowerCase()) : undefined;
  const metadataNameInfo = metadata && metadataIsName
    ? METANAME_METADATA_RE.exec(metadata) : undefined;

  // Verify this is a valid v2 address
  if (!isName && !isValidKristAddress(recipient, true))
    throw new ErrorInvalidParameter("to");

  const finalAmount = typeof amount === "string" ? parseInt(amount) : amount;

  if (isNaN(finalAmount) || finalAmount < 1)
    throw new ErrorInvalidParameter("amount");

  if (metadata && (!/^[\x20-\x7F\n]+$/i.test(metadata)
    || metadata.length > 255)) {
    throw new ErrorInvalidParameter("metadata");
  }

  // Address auth validation
  const { authed, address: sender } = await verifyAddress(req, privatekey);
  if (!authed) throw new ErrorAuthFailed();

  // Reject insufficient funds
  if (!sender || sender.balance < finalAmount)
    throw new ErrorInsufficientFunds();

  // If this is a name, pay to the owner of the name
  if (isName || metadataIsName) {
    // Fetch the name
    const metaname = isName ? nameInfo![1] : metadataNameInfo![1];
    const rawName = isName ? nameInfo![2] : metadataNameInfo![2];
    const dbName = await getName(rawName);
    if (!dbName) throw new ErrorNameNotFound(rawName);

    // Add the original name spec to the metadata
    if (isName) {
      if (metadata) { // Append with a semicolon if we already have metadata
        metadata = recipient.toLowerCase() + ";" + metadata;
      } else { // Set new metadata otherwise
        metadata = recipient.toLowerCase();
      }
    }

    // Create the transaction to the name's owner
    return await db.transaction(async dbTx => {
      return await pushTransaction(
        req,
        dbTx,
        sender.address,
        dbName.owner,
        finalAmount,
        metadata,
        undefined,
        metaname, dbName.name
      );
    });
  } else {
    // Create the transaction to the provided address
    return await db.transaction(async dbTx => {
      return await pushTransaction(
        req,
        dbTx,
        sender.address,
        recipient,
        finalAmount,
        metadata
      );
    });
  }
}
