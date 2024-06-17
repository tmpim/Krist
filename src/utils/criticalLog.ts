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

import chalkT from "chalk-template";
import dayjs from "dayjs";
import { APIMessage, WebhookClient } from "discord.js";
import { Request } from "express";
import PQueue from "p-queue";
import { getLogDetails } from "./log.js";
import { CRITICAL_LOG_URL } from "./vars.js";

const webhook = CRITICAL_LOG_URL
  ? new WebhookClient({ url: CRITICAL_LOG_URL })
  : null;

const logQueue = new PQueue({ concurrency: 1 });

interface CachedLog {
  key: string;
  hits: number;
  startTime: Date;
  endTime: Date;
  message: APIMessage;
  updatePending: boolean;
}

const cachedLogs: Record<string, CachedLog> = {};

export function criticalLog(
  key: string,
  req: Request,
  message: string,
  urgent?: boolean,
) {
  if (!webhook) return;

  const { ip, origin, userAgent, libraryAgent } = getLogDetails(req);
  const time = new Date();
  const finalKey = `${key}-${ip}`;

  logQueue.add(async () => {
    // If we've already sent a message for this alert within the last 30 minutes, don't send another
    const cached = cachedLogs[finalKey];
    if (cached) {
      cached.hits++;
      cached.endTime = time;
      cached.updatePending = true; // Queue an update to the message
      return;
    }

    // Send a new message and store the message ID
    const sent = await webhook.send({
      content: urgent ? `**[URGENT]**` : undefined,
      embeds: [{
        description: message ?? "(null)",
        fields: [
          { name: "Path", value: req.path ?? "(null)", inline: true },
          { name: "Method", value: req.method ?? "(null)", inline: true },
          { name: "IP", value: ip ?? "(null)", inline: true },
          { name: "Origin", value: origin ?? "(null)", inline: true },
          { name: "User Agent", value: userAgent ?? "(null)", inline: true },
          { name: "Library Agent", value: libraryAgent ?? "(null)", inline: true },
          { name: "Time", value: dayjs(time).format("YYYY-MM-DD HH:mm:ss"), inline: true },
        ]
      }],
      allowedMentions: { parse: [] }
    });

    cachedLogs[finalKey] = {
      key: finalKey,
      hits: 1,
      startTime: time,
      endTime: time,
      message: sent,
      updatePending: false,
    };
  }).catch(err => {
    console.error(chalkT`{red [CRITICAL]} Error submitting critical log:`, err);
  });
}

export function initCriticalLogUpdater() {
  if (!webhook) return;

  setInterval(async () => {
    for (const key in cachedLogs) {
      const log = cachedLogs[key];
      if (!log.updatePending) continue;

      // Update the 'Time' field of the message with the new hit count and start - end time range
      await webhook.editMessage(log.message.id, {
        content: log.message.content,
        embeds: [{
          ...log.message.embeds[0],
          fields: (log.message.embeds[0].fields ?? []).map(field =>
            field.name === "Time" ? {
              name: field.name,
              value: `**${log.hits} hit${log.hits > 1 ? "s" : ""}** from `
                + dayjs(log.startTime).format("YYYY-MM-DD HH:mm:ss")
                + " to " + dayjs(log.endTime).format("YYYY-MM-DD HH:mm:ss")
            } : field)
        }],
        allowedMentions: { parse: [] }
      });

      log.updatePending = false;

      // If the message hasn't been hit in the last 30 minutes, delete it from the cache
      if (log.endTime.getTime() < new Date().getTime() - 30 * 60 * 1000) {
        delete cachedLogs[key];
      }
    }
  }, 10 * 1000).unref();
}
