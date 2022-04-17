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

import chalk from "chalk";
import dayjs from "dayjs";
import { Request } from "express";

import { Address, SqTransaction, Transaction } from "../../database";

import { identifyTransactionType, transactionToJson } from ".";

import { getLogDetails } from "../../utils";

import promClient from "prom-client";
import { wsManager } from "../../websockets";
import { ErrorAddressNotFound, ErrorInsufficientFunds } from "../../errors";
import { criticalLog } from "../../utils/criticalLog";

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

/** Fully handles a transfer transaction; check the sender has sufficient funds,
 * decrements the sender's balance, increment's the recipient's balance, and
 * creates a transaction record by delegating to the createTransaction function.
 * Creates the recipient address if it does not exist. Most of the logic happens
 * in the innerPushTransaction function. This outer function is only responsible
 * for starting a database transaction if one wasn't already. */
export async function pushTransaction(
  req: Request,
  dbTx: SqTransaction,
  senderAddress: string,
  recipientAddress: string,
  amount: number,
  metadata?: string | null,
  name?: string | null,
  sentMetaname?: string | null,
  sentName?: string | null
): Promise<Transaction> {
  // Fetch the sender from the database. This should also be checked by the
  // caller anyway (name purchase/transfer, transaction sending, etc.), but it
  // is important to re-fetch here so that the balance can be checked as part of
  // the database transaction, otherwise a race may occur and Krist may be
  // duplicated, leaving the sender with a negative balance. Therefore, we fetch
  // as part of the transaction, and lock the row in the process.
  const sender = await Address.findOne({
    where: { address: senderAddress },
    transaction: dbTx,
    lock: true
  });

  // Check the sender exists and has sufficient funds for the transaction
  if (!sender) throw new ErrorAddressNotFound(senderAddress);
  if (sender.balance < amount) {
    const { logDetails } = getLogDetails(req);

    console.log(chalk`{red.bold [URGENT]} Race condition attempted in `
      + chalk`{bold ${amount} KST} transaction `
      + chalk`from {bold ${senderAddress || "(null)"}} `
      + chalk`to {bold ${recipientAddress || "(null)"}} at `
      + chalk`{cyan ${dayjs().format("HH:mm:ss DD/MM/YYYY")}} ${logDetails}`);

    criticalLog(
      req,
      `Race condition attempted in **${amount} KST** `
      + `transaction from **${senderAddress}** to **${recipientAddress}**`,
      true
    );

    throw new ErrorInsufficientFunds();
  }

  // Find the recipient. If it doesn't exist, it will be created later
  recipientAddress = recipientAddress.trim().toLowerCase();
  const recipient = await Address.findOne({
    where: { address: recipientAddress },
    transaction: dbTx
  });

  // Decrease the sender's own balance
  await sender.decrement({ balance: amount }, { transaction: dbTx });
  // Increase the sender's totalout
  await sender.increment({ totalout: amount }, { transaction: dbTx });

  // Create the transaction
  const newTransaction = await createTransaction(
    req,
    dbTx,
    recipientAddress,
    sender.address,
    amount,
    name, metadata,
    sentMetaname, sentName
  );

  if (!recipient) {
    // Create the recipient if they don't exist
    await Address.create({
      address: recipientAddress,
      firstseen: new Date(),
      balance: amount,
      totalin: amount,
      totalout: 0
    }, { transaction: dbTx });
  } else {
    // Otherwise, increment their balance and totalin
    await recipient.increment({
      balance: amount, totalin: amount
    }, { transaction: dbTx });
  }

  return newTransaction;
}

/** Creates the Transaction object in the database and broadcasts the WebSocket
 * event to all subscribers. */
export async function createTransaction(
  req: Request,
  dbTx: SqTransaction,
  to: string,
  from: string | null,
  value: number,
  name?: string | null,
  op?: string | null,
  sentMetaname?: string | null,
  sentName?: string | null
): Promise<Transaction> {
  const { logDetails, userAgent, origin } = getLogDetails(req);

  console.log(chalk`{bold [Krist]} Creating {bold ${value} KST} transaction `
    + chalk`from {bold ${from || "(null)"}} to {bold ${to || "(null)"}} at `
    + chalk`{cyan ${dayjs().format("HH:mm:ss DD/MM/YYYY")}} ${logDetails}`);

  // Create the new transaction object
  const newTransaction = await Transaction.create({
    to,
    from,
    value,
    name,
    time: new Date(),
    op,
    sent_metaname: sentMetaname,
    sent_name: sentName,
    useragent: userAgent,
    origin
  }, { transaction: dbTx });

  // After the database transaction is committed, broadcast the new transaction
  // to the websockets and increment the Prometheus transaction counter.
  dbTx?.afterCommit(async () => {
    // Make sure we have the latest transaction object
    await newTransaction.reload();

    // Increment the Prometheus transaction counter
    promTransactionCounter.inc({
      type: identifyTransactionType(newTransaction)
    });

    // Broadcast the transaction to websockets subscribed to transactions
    wsManager.broadcastEvent({
      type: "event",
      event: "transaction",
      transaction: transactionToJson(newTransaction)
    });
  });

  return newTransaction;
}
