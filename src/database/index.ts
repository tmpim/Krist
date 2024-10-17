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

import { AcquireConnectionOptions, Sequelize, Transaction } from "@sequelize/core";
import { MariaDbDialect } from "@sequelize/mariadb";
import { MigrationFn, SequelizeStorage, Umzug } from "umzug";
import chalkT from "chalk-template";
import client from "prom-client";
import { migrations } from "./migrations/barrel.js";

import {
  DB_HOST,
  DB_LOGGING,
  DB_NAME,
  DB_PASS,
  DB_POOL_ACQUIRE_MS,
  DB_POOL_EVICT_MS,
  DB_POOL_IDLE_MS,
  DB_POOL_MAX,
  DB_POOL_MIN,
  DB_POOL_MONITOR_ACQUIRE,
  DB_PORT,
  DB_USER,
  TEST
} from "../utils/vars.js";
import { SCHEMAS } from "./schemas.js";

export let db: Sequelize<MariaDbDialect>;

new client.Gauge({
  name: "krist_db_pool_read_size",
  help: "sequelize.pool.read.size",
  collect() { if (db.pool.read) this.set(db.pool.read.size); }
});
new client.Gauge({
  name: "krist_db_pool_read_available",
  help: "sequelize.pool.read.available",
  collect() { if (db.pool.read) this.set(db.pool.read.available); }
});
new client.Gauge({
  name: "krist_db_pool_read_using",
  help: "sequelize.pool.read.using",
  collect() { if (db.pool.read) this.set(db.pool.read.using); }
});
new client.Gauge({
  name: "krist_db_pool_read_waiting",
  help: "sequelize.pool.read.waiting",
  collect() { if (db.pool.read) this.set(db.pool.read.waiting); }
});
new client.Gauge({
  name: "krist_db_pool_read_min_size",
  help: "sequelize.pool.read.minSize",
  collect() { if (db.pool.read) this.set(db.pool.read.minSize); }
});
new client.Gauge({
  name: "krist_db_pool_read_max_size",
  help: "sequelize.pool.read.maxSize",
  collect() { if (db.pool.read) this.set(db.pool.read.maxSize); }
});

new client.Gauge({
  name: "krist_db_pool_write_size",
  help: "sequelize.pool.write.size",
  collect() { if (db.pool.write) this.set(db.pool.write.size); }
});
new client.Gauge({
  name: "krist_db_pool_write_available",
  help: "sequelize.pool.write.available",
  collect() { if (db.pool.write) this.set(db.pool.write.available); }
});
new client.Gauge({
  name: "krist_db_pool_write_using",
  help: "sequelize.pool.write.using",
  collect() { if (db.pool.write) this.set(db.pool.write.using); }
});
new client.Gauge({
  name: "krist_db_pool_write_waiting",
  help: "sequelize.pool.write.waiting",
  collect() { if (db.pool.write) this.set(db.pool.write.waiting); }
});
new client.Gauge({
  name: "krist_db_pool_write_min_size",
  help: "sequelize.pool.write.minSize",
  collect() { if (db.pool.write) this.set(db.pool.write.minSize); }
});
new client.Gauge({
  name: "krist_db_pool_write_max_size",
  help: "sequelize.pool.write.maxSize",
  collect() { if (db.pool.write) this.set(db.pool.write.maxSize); }
});

// =============================================================================
// Init database
// =============================================================================
export async function initDatabase(skipMigrations: boolean = false): Promise<void> {
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
      min: DB_POOL_MIN,
      max: DB_POOL_MAX,
      idle: DB_POOL_IDLE_MS,
      acquire: DB_POOL_ACQUIRE_MS,
      evict: DB_POOL_EVICT_MS
    },

    // Try to handle deadlocks due to pool exhaustion
    retry: {
      match: [/Deadlock/i],
      max: 3,
      backoffBase: 200,
      backoffExponent: 1.5,
    },

    // Manually pass around transactions ourselves, as the code already does
    disableClsTransactions: true
  });

  db.hooks.addListener("beforeConnect", () => console.log(chalkT`{yellow [DB]} Opening new connection`));
  db.hooks.addListener("afterConnect", () => console.log(chalkT`{green [DB]} Connection opened`));
  db.hooks.addListener("beforeDisconnect", () => console.log(chalkT`{yellow [DB]} Closing connection`));
  db.hooks.addListener("afterDisconnect", () => console.log(chalkT`{green [DB]} Connection closed`));

  if (DB_POOL_MONITOR_ACQUIRE) {
    const acquireAttempts = new WeakMap<AcquireConnectionOptions, number>();

    db.hooks.addListener("beforePoolAcquire", options => {
      if (!options) {
        console.log(chalkT`{red [DB]} Attempted to acquire connection without options, can't monitor`);
        return;
      }

      acquireAttempts.set(options, Date.now());
    });

    db.hooks.addListener("afterPoolAcquire", (_connection, options) => {
      if (!options) {
        console.log(chalkT`{red [DB]} Acquired connection without options, can't monitor`);
        return;
      }

      const startTime = acquireAttempts.get(options);
      if (!startTime) {
        console.log(chalkT`{red [DB]} Acquired connection without start time, can't monitor`);
        return;
      }

      const elapsedTime = Date.now() - startTime;
      console.log(chalkT`{yellow [DB]} Acquired connection in ${elapsedTime}ms`);
    });
  }

  try {
    await db.authenticate();
    console.log(chalkT`{green [DB]} Connected`);

    if (!skipMigrations) {
      console.log(chalkT`{yellow [DB]} Checking pending migrations...`);
      await runMigrations();
      console.log(chalkT`{green [DB]} Synced schemas`);
    }
  } catch (error) {
    console.error(error);
  }
}

export async function runMigrations(): Promise<void> {
  const umzug = new Umzug({
    migrations: Object.entries(migrations).map(([path, migration]) => {
      path = path.replace(/\.js$/, ".ts");
      const name = path.replace("./migrations/", "");
      return {
        name,
        path,
        up: migration.up as MigrationFn<Sequelize>,
        down: migration.down as MigrationFn<Sequelize>
      };
    }),
    context: db,
    storage: new SequelizeStorage({
      sequelize: db,
      tableName: TEST ? "SequelizeMetaTest" : "SequelizeMeta",
    }),
    logger: !TEST ? console : undefined // suppress migration logging during tests
  });

  await umzug.up();
}

export type Limit = string | number | null | undefined;
export type Offset = string | number | null | undefined;
export interface PaginatedResult<M> { rows: M[]; count: number }

// Alias for Sequelize.Transaction as it conflicts with the Krist Transaction
export type SqTransaction = Transaction;

export * from "./schemas.js";

export async function shutdownDb(): Promise<void> {
  console.log(chalkT`{cyan [DB]} Disconnecting from database`);
  await db.close();
  console.log(chalkT`{green [DB]} Disconnected`);
}
