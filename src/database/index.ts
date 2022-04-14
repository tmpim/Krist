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
import { Sequelize } from "sequelize-typescript";
import { Transaction } from "sequelize";

import { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } from "../utils/constants";
import { SCHEMAS } from "./schemas";

export let db: Sequelize;

// =============================================================================
// Init database
// =============================================================================
export async function initDatabase(): Promise<void> {
  console.log(chalk`{cyan [DB]} Connecting to database {bold ${DB_NAME}} as user {bold ${DB_USER}}...`);

  db = new Sequelize({
    dialect: "mysql",
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASS,
    host: DB_HOST,
    port: DB_PORT,
    logging: false,
    models: SCHEMAS,
    pool: {
      max: 6,
      min: 2,
      idle: 10000
    }
  });

  try {
    await db.authenticate();
    console.log(chalk`{green [DB]} Connected`);

    await db.sync();
    console.log(chalk`{green [DB]} Synced schemas`);
  } catch (error) {
    console.error(error);
  }
}

export type Limit = string | number | null | undefined;
export type Offset = string | number | null | undefined;
export interface PaginatedResult<M> { rows: M[]; count: number }

// Alias for Sequelize.Transaction as it conflicts with the Krist Transaction
export type SqTransaction = Transaction;

export * from "./schemas";
