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

import { redis, rKey } from "../database/redis";
import { Block } from "../database";

import { isMiningEnabled } from "./mining";
import { getWork, setWork } from "./work";
import { MAX_WORK } from "../utils/constants";

export async function initKrist(): Promise<void> {
  console.log(chalk`{bold [Krist]} Loading...`);

  // Check if mining is enabled
  if (!await redis.exists(rKey("mining-enabled"))) {
    console.log(chalk`{yellow.bold [Krist]} Note: Initialised with mining disabled.`);
    await redis.set(rKey("mining-enabled"), "false");
  } else {
    const miningEnabled = await isMiningEnabled();
    if (miningEnabled) console.log(chalk`{green.bold [Krist]} Mining is enabled.`);
    else               console.log(chalk`{red.bold [Krist]} Mining is disabled!`);
  }

  // Check for a genesis block
  const lastBlock = await Block.findOne({ order: [["id", "DESC"]] });
  if (!lastBlock) {
    console.log(chalk`{yellow.bold [Krist]} Warning: Genesis block not found. Mining may not behave correctly.`);
  }

  // Pre-initialise the work to 100,000
  if (!await redis.exists(rKey("work"))) {
    const defaultWork = MAX_WORK;
    console.log(chalk`{yellow.bold [Krist]} Warning: Work was not yet set in Redis. It will be initialised to: {green ${defaultWork}}`);
    await setWork(defaultWork);
  }
  console.log(chalk`{bold [Krist]} Current work: {green ${await getWork()}}`);
}
