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
import { promises as fsp } from "fs";

import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";

import { wsManager } from ".";

import {
  ErrorInvalidParameter, ErrorMissingParameter, errorToJson
} from "../errors";
import { fileExists } from "../utils";
import { TEST, WS_IPC_PATH } from "../utils/constants";
import { WebSocketEventMessage } from "./types";

export async function initWebSocketIpc(): Promise<void> {
  if (TEST || !WS_IPC_PATH) return;

  console.log(chalk`{cyan [Websockets]} Starting IPC server`);

  if (await fileExists(WS_IPC_PATH)) {
    console.log(chalk`{cyan [Websockets]} Cleaning up existing IPC socket`);
    await fsp.unlink(WS_IPC_PATH);
  }

  const app = express();
  app.use(bodyParser.json());

  app.post("/event", async (req, res) => {
    // Primitive validation
    const { body } = req;
    if (!body.event) throw new ErrorMissingParameter("event");

    let eventData;
    switch (body.event) {
    case "block":
      if (!body.block) throw new ErrorMissingParameter("block");
      eventData = { block: body.block };
      break;

    case "transaction":
      if (!body.transaction) throw new ErrorMissingParameter("transaction");
      eventData = { transaction: body.transaction };
      break;

    case "name":
      if (!body.name) throw new ErrorMissingParameter("name");
      eventData = { name: body.name };
      break;

    default:
      throw new ErrorInvalidParameter("event");
    }

    const rawEvent: WebSocketEventMessage = {
      type: "event",
      event: body.event,
      ...eventData
    };
    const recipients = wsManager.broadcastEvent(rawEvent);

    console.log(chalk`{yellow [Websockets]} Event {bold ${body.event}} broadcast via IPC to {bold ${recipients} recipients}. Raw event:\n`, rawEvent);

    return res.json({
      ok: true,
      recipients
    });
  });

  // Error handler
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    // Don't do anything if a response has already been sent
    if (res.headersSent) return next(err);
    res.status(200).json(errorToJson(err));
  });

  const server = app.listen(WS_IPC_PATH, () => {
    console.log(chalk`{green [Websockets]} Started IPC server`);
  });

  server.on("error", err => {
    console.error(chalk`{red [Websockets]} Error starting IPC:`);
    console.error(err);
  });
}
