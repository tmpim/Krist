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

import { Request } from "express";
import { isNaN } from "lodash-es";
import { db, Limit, Offset, PaginatedResult, Transaction } from "../database/index.js";
import {
  ErrorAddressNotFound,
  ErrorAuthFailed,
  ErrorInsufficientFunds,
  ErrorInvalidParameter,
  ErrorMissingParameter,
  ErrorNameNotFound,
  ErrorRateLimitHit,
  ErrorTransactionNotFound,
  ErrorTransactionsDisabled
} from "../errors/index.js";
import { getAddress } from "../krist/addresses/index.js";
import { verifyAddress } from "../krist/addresses/verify.js";
import { getName } from "../krist/names/index.js";
import { areTransactionsEnabled } from "../krist/switches.js";
import { pushTransaction } from "../krist/transactions/create.js";
import { getTransaction, getTransactions, getTransactionsByAddress } from "../krist/transactions/index.js";
import { isValidKristAddress, METANAME_METADATA_RE, NAME_META_RE, REQUEST_ID_RE, validateLimitOffset } from "../utils/index.js";
import { checkTxRateLimits } from "../utils/rateLimit.js";

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
  rawAmount?: string | number,
  metadata?: string,
  requestId?: string
): Promise<Transaction> {
  if (!await areTransactionsEnabled()) throw new ErrorTransactionsDisabled();

  // Input validation
  if (!privatekey) throw new ErrorMissingParameter("privatekey");
  if (!recipient) throw new ErrorMissingParameter("to");
  if (!rawAmount) throw new ErrorMissingParameter("amount");

  if (requestId && !REQUEST_ID_RE.test(requestId))
    throw new ErrorInvalidParameter("requestId");

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

  const amount = typeof rawAmount === "string"
    ? Math.trunc(parseInt(rawAmount))
    : Math.trunc(rawAmount);

  if (isNaN(amount) || amount < 1)
    throw new ErrorInvalidParameter("amount");

  if (metadata && (!/^[\x20-\x7F\n]+$/i.test(metadata)
    || metadata.length > 255)) {
    throw new ErrorInvalidParameter("metadata");
  }

  // Address auth validation
  const { authed, address: sender } = await verifyAddress(req, privatekey);
  if (!authed) throw new ErrorAuthFailed();

  // Apply rate limits now that we know the source address
  if (!await checkTxRateLimits(req.ip, sender.address))
    throw new ErrorRateLimitHit();

  // Reject insufficient funds
  if (!sender || sender.balance < amount)
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
        amount,
        metadata,
        undefined,
        metaname, dbName.name,
        requestId
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
        amount,
        metadata,
        undefined,
        undefined,
        undefined,
        requestId
      );
    });
  }
}
