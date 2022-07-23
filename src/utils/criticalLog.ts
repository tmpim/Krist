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

import { Request } from "express";
import axios from "axios";

import { CRITICAL_LOG_URL } from "./constants";
import { getLogDetails } from "./log";

import dayjs from "dayjs";
import chalk from "chalk";

export async function criticalLog(
  req: Request,
  message: string,
  urgent?: boolean
): Promise<void> {
  if (!CRITICAL_LOG_URL) return;

  try {
    const { ip, origin, userAgent, libraryAgent } = getLogDetails(req);

    axios.post(CRITICAL_LOG_URL, {
      content: urgent ? `@everyone **[URGENT]**` : undefined,
      embeds: [{
        description: message ?? "(null)",
        fields: [
          { name: "Path", value: req.path ?? "(null)", inline: true },
          { name: "Method", value: req.method ?? "(null)", inline: true },
          { name: "IP", value: ip ?? "(null)", inline: true },
          { name: "Origin", value: origin ?? "(null)", inline: true },
          { name: "User Agent", value: userAgent ?? "(null)", inline: true },
          { name: "Library Agent", value: libraryAgent ?? "(null)", inline: true },
          { name: "Time",
            value: dayjs().format("HH:mm:ss DD/MM/YYYY"),
            inline: true },
        ]
      }]
    });
  } catch (err) {
    console.error(chalk`{red [CRITICAL]} Error submitting critical log:`, err);
  }
}
