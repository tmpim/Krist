/**
 * Created by Drew Lemmy, 2016
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
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

const config = require("./config.js");
const package = require("./package.json");
const chalk = require("chalk");

require("console-stamp")(console, {
  pattern: "HH:MM:ss",
  label: false,
  colors: {
    stamp: "yellow"
  }
});

const database = require("./src/database.js");
const webserver = require("./src/webserver.js");

console.log(chalk`Starting {bold ${package.name}} {blue ${package.version}}...`);

async function main() {
  await database.init();

  require("./src/krist.js").init();
  if (config.debugMode) require("./src/debug.js");

  return webserver.init();
}

main().catch(console.error);
