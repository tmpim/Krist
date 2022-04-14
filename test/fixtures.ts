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

import "dotenv/config";

import * as chai from "chai";
import chaiHttp from "chai-http";
import sinon, { SinonSandbox } from "sinon";

import chalk from "chalk";

import { initDatabase, db } from "../src/database";
import { initRedis, redis, rKey } from "../src/database/redis";
import { initWebserver, server } from "../src/webserver";
import { initKrist } from "../src/krist";

import { teardownWorkOverTime } from "../src/krist/work";
import { RootHookObject } from "mocha";

exports.mochaGlobalSetup = async function() {
  chai.use(chaiHttp);

  await initRedis();
  await initDatabase();
  await initWebserver();
  await initKrist();
};

exports.mochaGlobalTeardown = async function() {
  console.log(chalk`{red [Tests]} Stopping web server and database`);

  // Undo some changes made by the test runner
  await redis.set(rKey("mining-enabled"), "false");

  server.close();
  await db.close();
  teardownWorkOverTime();
};

let sandbox: SinonSandbox;
export const mochaHooks = (): RootHookObject => ({
  beforeEach(done) {
    // Suppress Krist's rather verbose logging during tests
    if (!process.env.TEST_DEBUG) {
      sandbox = sinon.createSandbox();
      sandbox.stub(console, "log");
    }
    done();
  },

  afterEach(done) {
    if (!process.env.TEST_DEBUG) sandbox.restore();
    done();
  }
});
