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

const chalk = require("chalk");
const krist = require("./krist.js");
const addresses = require("./addresses.js");

const debugCommands = {
  "setwork": async args => {
    const newWork = parseInt(args[1]);
    await krist.setWork(newWork);
    console.log(chalk`{bold [Debug]} New work: {green ${newWork}}`);
  },

  "getwork": async () => {
    const currentWork = await krist.getWork();
    console.log(chalk`{bold [Debug]} Current work: {green ${currentWork}}`);
  },

  "setbalance": async args => {
    const address = args[1].toLowerCase();
    const balance = parseInt(args[2]);

    const dbAddress = await addresses.getAddress(address);
    if (!dbAddress)
      return console.log(chalk`{red [Debug]} Unknown address '{blue ${address}}'`);

    await dbAddress.update({ balance });
    console.log(chalk`{bold [Debug]} {blue ${address}} new balance: {green ${balance}}`);
  },

  "freenonce": () => {
    krist.freeNonceSubmission = !krist.freeNonceSubmission;
    console.log(chalk`{bold [Debug]} Free nonce submission is now: {bold ${krist.freeNonceSubmission}}`);
  },

  "setmotd": async args => {
    const motd = args[1];
    await krist.setMOTD(motd);
    console.log(chalk`{bold [Debug]} Set MOTD to: {bold ${motd}}`);
  }
};

const stdin = process.openStdin();

stdin.addListener("data", async function (d) {
  const args = d.toString().trim().split(" ");
  const command = args[0].toLowerCase();
  const commandHandler = debugCommands[command];

  if (!commandHandler)
    return console.log(chalk`{red [Debug]} Unknown command '{blue ${command}}'`);

  commandHandler(args);
});
