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
import { getAddress } from "./krist/addresses";
import { setWork } from "./krist/work";

interface DebugCommand {
  (args: string[]): Promise<void>;
}

const COMMANDS: Record<string, DebugCommand> = {
  "setwork": async args => {
    const newWork = parseInt(args[1]);
    await setWork(newWork);
    console.log(chalk`{bold [Debug]} New work: {green ${newWork}}`);
  },

  "setbalance": async args => {
    const address = args[1].toLowerCase();
    const balance = parseInt(args[2]);

    const dbAddress = await getAddress(address);
    if (!dbAddress) {
      return console.log(chalk`{red [Debug]} Unknown address '{blue ${address}}'`);
    }

    await dbAddress.update({ balance });
    console.log(chalk`{bold [Debug]} {blue ${address}} new balance: {green ${balance}}`);
  }
};

export function initDebug(): void {
  // Only start the debug server if we're not in production
  if (process.env.NODE_ENV === "production"
    || process.env.NODE_ENV === "test") {
    return;
  }

  const stdin = process.openStdin();

  stdin.addListener("data", async data => {
    const args = data.toString().trim().split(" ");
    const command = args[0].toLowerCase();
    const commandHandler = COMMANDS[command];

    if (!commandHandler) {
      return console.log(chalk`{red [Debug]} Unknown command '{blue ${command}}'`);
    }

    commandHandler(args);
  });
}
