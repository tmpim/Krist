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

import { Express, Request } from "express";
import basicAuth from "express-basic-auth";

import client from "prom-client";

import { USE_PROMETHEUS, PROMETHEUS_PASSWORD } from "./../utils/constants";

client.collectDefaultMetrics();

const up = new client.Gauge({
  name: "krist_up",
  help: "Whether or not the Krist server is running."
});
up.set(1);

const debug = new client.Gauge({
  name: "krist_debug",
  help: "Whether or not the Krist server is in debug mode."
});
debug.set(process.env.NODE_ENV !== "production" ? 1 : 0);

export function initPrometheus(app: Express): void {
  // no-op if prometheus is disabled
  if (!USE_PROMETHEUS) return;

  // protect the metrics endpoint if a password was specified
  if (PROMETHEUS_PASSWORD) {
    app.use("/metrics", basicAuth({
      users: { "prometheus": PROMETHEUS_PASSWORD },

      unauthorizedResponse(req: Request) {
        console.log(chalk`{red [Webserver]} Unauthorized access on Prometheus endpoint from {bold ${req.ip}}!`);
        return "";
      }
    }));
  }

  app.use("/metrics", async (req, res) => {
    try {
      res.set("Content-Type", client.register.contentType);
      res.end(await client.register.metrics());
    } catch (err) {
      res.status(500).end(err);
    }
  });

  console.log(chalk`{cyan [Webserver]} Prometheus is enabled!`);
}
