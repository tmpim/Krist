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

import { Op } from "@sequelize/core";
import chalkT from "chalk-template";
import dayjs from "dayjs";
import { Request } from "express";
import promClient from "prom-client";
import { Address, Block, db, Name } from "../../database/index.js";
import { ErrorMiningDisabled, ErrorSolutionDuplicate, ErrorSolutionIncorrect } from "../../errors/index.js";
import { invalidateCountCache } from "../../utils/cache.js";
import { getLogDetails, sha256 } from "../../utils/index.js";
import { MAX_WORK, MIN_WORK, SECONDS_PER_BLOCK, WORK_FACTOR } from "../../utils/vars.js";
import { wsManager } from "../../websockets/index.js";
import { getAddress } from "../addresses/index.js";
import { logAuth } from "../authLog.js";
import { isMiningEnabled } from "../switches.js";
import { createTransaction } from "../transactions/create.js";
import { getWork, setWork } from "../work.js";
import { blockToJson, getBlockValue, getLastBlock } from "./index.js";
import { GENESIS_HASH } from "./index.js";

const promBlockCounter = new promClient.Counter({
  name: "krist_blocks_total",
  help: "Total number of blocks since the Krist server started."
});

export interface SubmitBlockResponse {
  address: Address;
  block: Block;
  work: number;
}

export async function submitBlock(
  req: Request,
  address: string,
  rawNonce: number[] | string
): Promise<SubmitBlockResponse> {
  // If binary nonce is submitted as an array of numbers, convert it to a
  // Uint8Array here
  const nonce = Array.isArray(rawNonce) ? new Uint8Array(rawNonce) : rawNonce;
  const lastBlock = await getLastBlock();
  if (!lastBlock) throw new ErrorMiningDisabled();

  // Verify the provided nonce is a solution to the current block
  const last = (lastBlock.hash ?? GENESIS_HASH).substring(0, 12);
  const work = await getWork();
  const hash = sha256(address, last, nonce);

  if (parseInt(hash.substring(0, 12), 16) <= work) {
    // Correct solution
    try {
      // Correct and unique solution if this doesn't error
      return await createBlock(req, hash, address, nonce);
    } catch (err: unknown) {
      // Reject duplicate hashes - Sequelize throws a very helpful error here
      if (Array.isArray((err as any).errors)
        && (err as any).errors[0].type === "unique violation"
        && (err as any).errors[0].path === "hash") {
        throw new ErrorSolutionDuplicate();
      }

      // Unknown error - huh?
      console.error("Unknown submission error:", err);
      throw err;
    }
  } else {
    throw new ErrorSolutionIncorrect();
  }
}

export async function createBlock(
  req: Request,
  hash: string,
  address: string,
  nonce: Uint8Array | string
): Promise<SubmitBlockResponse> {
  if (!await isMiningEnabled()) throw new ErrorMiningDisabled();

  const { logDetails, userAgent, libraryAgent, origin } = getLogDetails(req);
  logAuth(req, address, "mining").catch(console.error);

  const {
    block: retBlock,
    newWork: retWork,
    kristAddress: retAddress
  } = await db.transaction(async dbTx => {
    const lastBlock = await getLastBlock(dbTx);
    if (!lastBlock) throw new Error("No last block!");

    const value = await getBlockValue();
    const time = new Date();

    const oldWork = await getWork();

    const seconds = (time.getTime() - lastBlock.time.getTime()) / 1000;
    const targetWork = seconds * oldWork / SECONDS_PER_BLOCK;
    const diff = targetWork - oldWork;

    const newWork = Math.round(Math.max(
      Math.min(oldWork + diff * WORK_FACTOR, MAX_WORK),
      MIN_WORK
    ));

    console.log(chalkT`{bold [Krist]} Submitting {bold ${value} KST} block by {bold ${address}} at {cyan ${dayjs().format("HH:mm:ss DD/MM/YYYY")}} ${logDetails}`);
    promBlockCounter.inc();

    // Create the new block
    const block = await Block.create({
      hash,
      address,
      // Convert nonces to a hex string, binary or not
      nonce: typeof nonce === "string"
        ? Buffer.from(nonce, "binary").toString("hex")
        : Buffer.from(nonce).toString("hex"),
      time,
      difficulty: oldWork,
      value,
      useragent: userAgent,
      library_agent: libraryAgent,
      origin
    }, { transaction: dbTx });

    // Create the transaction
    await createTransaction(req, dbTx, address, null, value);

    // Decrement all unpaid name counters
    await Name.decrement(
      { unpaid: 1 },
      {
        where: { unpaid: { [Op.gt]: 0 } },
        transaction: dbTx
      }
    );

    // See if the address already exists before depositing Krist to it
    let kristAddress = await getAddress(address);
    if (kristAddress) { // Address exists, increment its balance
      await kristAddress.increment(
        { balance: value, totalin: value },
        { transaction: dbTx }
      );
    } else { // Address doesn't exist, create it
      kristAddress = await Address.create({
        address,
        firstseen: time,
        balance: value,
        totalin: value,
        totalout: 0
      }, { transaction: dbTx });

      dbTx.afterCommit(async () => {
        // Invalidate address count caches (new address created)
        await invalidateCountCache(Address.name);
      });
    }

    return {
      block,
      newWork,
      kristAddress
    };
  });

  // Get the updated address balance to return to the API
  await retAddress.reload();

  // Save the new work
  console.log(chalkT`        New work: {green ${retWork.toLocaleString()}} New balance: {green ${retAddress.balance}}`);
  await setWork(retWork);

  // Invalidate block count caches
  await invalidateCountCache(Block.name);

  // Submit the new block event to all websockets (async)
  wsManager.broadcastEvent({
    type: "event",
    event: "block",
    block: blockToJson(retBlock),
    new_work: retWork
  });

  return { work: retWork, address: retAddress, block: retBlock };
}
