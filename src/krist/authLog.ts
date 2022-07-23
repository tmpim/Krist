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
import cron from "node-cron";
import { Request } from "express";
import { Op, Sequelize } from "sequelize";

import { AuthLog } from "../database";

import { getLogDetails } from "../utils";

export type AuthLogType = "auth" | "mining";

export function initAuthLogCleanup(): void {
  // Start the hourly auth log cleaner, and also run it immediately
  cron.schedule("0 0 * * * *", () => cleanAuthLog().catch(console.error));
  cleanAuthLog().catch(console.error);
}

/** For privacy reasons, purge entries from the auth log older than 30 days. */
async function cleanAuthLog(): Promise<void> {
  const destroyed = await AuthLog.destroy({
    where: {
      time: { [Op.lte]: Sequelize.literal("NOW() - INTERVAL 30 DAY")}
    }
  });
  console.log(chalk`{cyan [Auth]} Purged {bold ${destroyed}} auth log entries`);
}

export async function logAuth(
  req: Request,
  address: string,
  type: AuthLogType
): Promise<void> {
  const { ip, path, userAgent, libraryAgent, origin, logDetails } = getLogDetails(req);

  if (type === "auth") {
    console.log(chalk`{green [Auth]} ({bold ${path}}) Successful auth on address {bold ${address}} ${logDetails}`);
  }

  // Check if there's already a recent log entry with these details. If there
  // were any within the last 30 minutes, don't add any new ones.
  const existing = await AuthLog.findOne({
    where: {
      ip,
      address,
      time: { [Op.gte]: Sequelize.literal("NOW() - INTERVAL 30 MINUTE")},
      type
    }
  });
  if (existing) return;

  AuthLog.create({
    ip,
    address,
    time: new Date(),
    type,
    useragent: userAgent,
    library_agent: libraryAgent,
    origin
  });
}
