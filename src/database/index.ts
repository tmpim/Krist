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

import { Sequelize, Transaction } from "@sequelize/core";
import { MariaDbDialect } from "@sequelize/mariadb";
import chalkT from "chalk-template";

import { DB_HOST, DB_LOGGING, DB_NAME, DB_PASS, DB_PORT, DB_USER, TEST } from "../utils/vars.js";
import { SCHEMAS } from "./schemas.js";

export let db: Sequelize;

// =============================================================================
// Init database
// =============================================================================
export async function initDatabase(): Promise<void> {
  console.log(chalkT`{cyan [DB]} Connecting to database {bold ${DB_NAME}} at {bold ${DB_HOST}}:{bold ${DB_PORT}} as user {bold ${DB_USER}} (env: ${process.env.NODE_ENV}, test: ${TEST ? "TRUE" : "false"})...`);

  db = new Sequelize({
    dialect: MariaDbDialect,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASS,
    host: DB_HOST,
    port: DB_PORT,
    logging: DB_LOGGING ? console.log : false,
    models: SCHEMAS,
    pool: {
      max: 5,
      min: 3,
      idle: 300_000,
      acquire: 30_000,
      evict: 10_000,
    }
  });

  try {
    await db.authenticate();
    console.log(chalkT`{green [DB]} Connected`);

    await db.sync();
    console.log(chalkT`{green [DB]} Synced schemas`);
  } catch (error) {
    console.error(error);
  }
}

export type Limit = string | number | null | undefined;
export type Offset = string | number | null | undefined;
export interface PaginatedResult<M> { rows: M[]; count: number }

// Alias for Sequelize.Transaction as it conflicts with the Krist Transaction
export type SqTransaction = Transaction;

export * from "./schemas.js";

export async function shutdownDb() {
  console.log(chalkT`{cyan [DB]} Disconnecting from database`);
  await db.close();
  console.log(chalkT`{green [DB]} Disconnected`);
}
