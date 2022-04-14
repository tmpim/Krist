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

import express, { Express, NextFunction, Request, Response } from "express";
import { Server } from "http";
import bodyParser from "body-parser";
import expressWs from "express-ws";
import { engine } from "express-handlebars";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cors from "cors";

import { initPrometheus } from "./prometheus";

import apiRoutes from "./routes";

import { errorToJson } from "../errors";
import { ErrorRouteNotFound } from "../errors/webserver";

import { TEST, WEB_LISTEN } from "../utils/constants";

export let app: Express;
export let ws: expressWs.Instance;
export let server: Server;

export async function initWebserver(): Promise<void> {
  app = express();
  ws = expressWs(app);

  app.enable("trust proxy");
  app.disable("x-powered-by");
  app.disable("etag");

  initPrometheus(app);

  app.use(cors());

  app.use((req, res, next) => {
    delete req.headers["content-encoding"];
    next();
  });

  app.use(express.static("static"));

  app.engine(".hbs", engine({
    extname: ".hbs",
    helpers: {
      concat(str: string, suffix: string) {
        if (typeof str === "string" && typeof suffix === "string") {
          return str + suffix;
        }
        return str;
      }
    }
  }));
  app.set("view engine", ".hbs");
  app.locals.debug = process.env.NODE_ENV !== "production";

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  if (!TEST) {
    app.use(rateLimit({
      windowMs: 60000, max: 320,
      message: { ok: false, error: "rate_limit_hit" },
    }));

    app.use(slowDown({
      windowMs: 60000,
      delayAfter: 240,
      delayMs: 100,
      maxDelayMs: 2000
    }));
  }

  app.all("*", (req, res, next) => {
    res.header("X-Robots-Tag", "none");
    res.header("Content-Type", "application/json");
    next();
  });

  app.all("/", (req, res, next) => {
    res.header("Content-Type", "text/plain");
    next();
  });

  // Primary router, loads all the API routes
  app.use(apiRoutes());

  // 404 page
  app.use((req, res) => {
    if (req.accepts("html")) { // Respond to browsers with HTML 404 page
      res.header("Content-Type", "text/html");
      res.render("error_404");
    } else { // Respond to API requests with JSON 404 response
      throw new ErrorRouteNotFound();
    }
  });

  // Error handler - convert KristErrors to sendErrorToRes
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    // Don't do anything if a response has already been sent
    if (res.headersSent) return next(err);

    // TODO: Due to a long-standing bug in the Krist server, status codes do not
    //       actually do anything, regardless of whether or not the `cc`
    //       parameter is set. Sending correct status codes will likely break
    //       many existing programs. Therefore, we always send 200 on error.
    res.status(200).json(errorToJson(err));
  });

  await new Promise<void>((resolve, reject) => {
    server = app.listen(WEB_LISTEN, () => {
      console.log(chalk`{green [Webserver]} Listening on {bold ${WEB_LISTEN}}`);
      resolve();
    });

    server.on("error", reject);
  });
}

export * from "./utils";
