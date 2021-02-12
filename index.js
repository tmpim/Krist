/**
 * Created by Drew Lemmy, 2016-2021
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

require("dotenv").config();
const package = require("./package.json");
const chalk = require("chalk");

require("console-stamp")(console, {
  pattern: "HH:MM:ss",
  label: false,
  colors: {
    stamp: "yellow"
  }
});

const REQUIRED_ENV_VARS = [
  "DB_PASS",
  "PUBLIC_URL"
];
const missing = REQUIRED_ENV_VARS.filter(e => !process.env[e]);
if (missing.length) {
  console.error(chalk.bold.red("Missing environment variables:"));
  console.error(missing.map(e => chalk.red(e)).join(", "));
  process.exit(1);
}

const database         = require("./src/database.js");
const redis            = require("./src/redis.js");
const webserver        = require("./src/webserver.js");

console.log(chalk`Starting {bold ${package.name}} {blue ${package.version}}...`);

async function main() {
  redis.init();
  await database.init();
  
  require("./src/krist.js").init();
  if (process.env.NODE_ENV !== "production") require("./src/debug.js");

  return webserver.init();
}

main().catch(console.error);
