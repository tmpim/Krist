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

import { Address, SqTransaction, Transaction } from "../../database";

import { getAddress } from "../addresses";
import { identifyTransactionType, transactionToJson } from ".";

import promClient from "prom-client";
import { wsManager } from "../../websockets";

const promTransactionCounter = new promClient.Counter({
  name: "krist_transactions_total",
  help: "Total number of transactions since the Krist server started.",
  labelNames: ["type"]
});

// Initialize the counters to prevent 'no data' in Grafana
promTransactionCounter.inc({ type: "unknown" }, 0);
promTransactionCounter.inc({ type: "mined" }, 0);
promTransactionCounter.inc({ type: "name_purchase" }, 0);
promTransactionCounter.inc({ type: "name_a_record" }, 0);
promTransactionCounter.inc({ type: "name_transfer" }, 0);
promTransactionCounter.inc({ type: "transfer" }, 0);

export async function createTransaction(
  to: string,
  from: string | null,
  value: number,
  name?: string | null,
  op?: string | null,
  dbTx?: SqTransaction,
  userAgent?: string | null,
  origin?: string | null,
  sentMetaname?: string | null,
  sentName?: string | null
): Promise<Transaction> {
  // Create the new transaction object
  const newTransaction = await Transaction.create({
    to,
    from,
    value,
    name,
    time: new Date(),
    op,
    useragent: userAgent,
    origin,
    sent_metaname: sentMetaname,
    sent_name: sentName
  }, { transaction: dbTx });

  promTransactionCounter.inc({
    type: identifyTransactionType(newTransaction)
  });

  // Broadcast the transaction to websockets subscribed to transactions (async)
  wsManager.broadcastEvent({
    type: "event",
    event: "transaction",
    transaction: transactionToJson(newTransaction)
  });

  return newTransaction;
}

export async function pushTransaction(
  sender: Address,
  recipientAddress: string,
  amount: number,
  metadata?: string | null,
  name?: string | null,
  dbTx?: SqTransaction,
  userAgent?: string | null,
  origin?: string | null,
  sentMetaname?: string | null,
  sentName?: string | null
): Promise<Transaction> {
  const recipient = await getAddress(recipientAddress);

  // Do these in parallel:
  const [,, newTransaction] = await Promise.all([
    // Decrease the sender's own balance
    sender.decrement({ balance: amount }, { transaction: dbTx }),
    // Increase the sender's totalout
    sender.increment({ totalout: amount }, { transaction: dbTx }),

    // Create the transaction
    createTransaction(
      recipientAddress,
      sender.address,
      amount,
      name, metadata,
      dbTx,
      userAgent, origin,
      sentMetaname, sentName
    ),

    // Create the recipient if they don't exist,
    !recipient
      ? Address.create({
        address: recipientAddress.toLowerCase(),
        firstseen: new Date(),
        balance: amount,
        totalin: amount,
        totalout: 0
      }, { transaction: dbTx })
    // Otherwise, increment their balance and totalin
      : recipient.increment({ balance: amount, totalin: amount }, { transaction: dbTx })
  ]);

  return newTransaction;
}
