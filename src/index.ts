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

import "./utils/setup";

import chalk from "chalk";
import packageJson from "../package.json";

import { checkEnvVars } from "./utils";
import { initDatabase } from "./database";
import { initRedis } from "./database/redis";
import { initKrist } from "./krist";
import { initWorkOverTime } from "./krist/work";
import { initAuthLogCleanup } from "./krist/authLog";
import { initDebug } from "./debug";
import { initWebserver } from "./webserver";
import { initWebSocketIpc } from "./websockets/ipc";

async function main() {
  console.log(chalk`Starting {bold ${packageJson.name}} {blue ${packageJson.version}}...`);

  checkEnvVars();
  await initRedis();
  await initDatabase();
  await initKrist();
  initWorkOverTime();
  initAuthLogCleanup();
  initDebug();
  await initWebSocketIpc();
  await initWebserver();
}

main().catch(console.error);
