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

import { Request } from "express";
import WebSocket from "ws";
import { ErrorInvalidParameter, ErrorMissingParameter, errorToJson, KristError } from "../errors/index.js";
import { getDetailedMotd } from "../krist/motd.js";
import { promWebsocketKeepalivesTotal, promWebsocketMessagesTotal } from "./prometheus.js";
import { handleWebSocketMessage } from "./routes/index.js";
import {
  IncomingWebSocketMessage,
  OutgoingWebSocketMessage,
  VALID_MESSAGE_TYPES,
  WebSocketMessageType,
  WebSocketSubscription
} from "./types.js";

export class WrappedWebSocket {
  private keepaliveTimer?: NodeJS.Timeout;

  constructor(
    public req: Request,
    public socket: WebSocket,
    public token: string,
    public address: string | "guest",
    public privatekey?: string,
    public subs: WebSocketSubscription[] = ["ownTransactions", "blocks"],
    public isGuest: boolean = address === "guest"
  ) {}

  init(): void {
    this.socket.on("close", () => {
      // Clear any pending keepalive
      if (this.keepaliveTimer) clearTimeout(this.keepaliveTimer);
    });

    this.socket.on("error", err => {
      console.error("Fatal websocket error:", err);
    });

    this.initMessageHandler();

    // Break the ice - say hello and then send the first keepalive, which will
    // also handle queueing subsequent keepalives
    this.sendHello()
      .then(() => this.sendKeepalive());
  }

  initMessageHandler(): void {
    this.socket.on("message", async rawData => {
      let id: string | number | undefined | null = undefined;

      // Outer error handler - if an error occurs, respond with an error
      // message, converting a KristError where possible
      try {
        // =====================================================================
        // VALIDATION
        // =====================================================================
        // Validate message length
        const strData = rawData.toString("utf-8");
        if (strData.length > 512) throw new KristError("message_too_long");

        // Validate message is JSON
        let msg: IncomingWebSocketMessage;
        try {
          msg = JSON.parse(strData);
        } catch (parseErr) {
          throw new KristError("syntax_error");
        }

        // Validate message contains an ID to reply to
        if ((typeof msg.id !== "number" && typeof msg.id !== "string"))
          throw new ErrorMissingParameter("id");
        id = msg.id;

        // Validate message contains a type
        if (typeof msg.type !== "string")
          throw new ErrorMissingParameter("type");
        const type = msg.type.trim().toLowerCase() as WebSocketMessageType;
        if (!VALID_MESSAGE_TYPES[type])
          throw new ErrorInvalidParameter("type");

        // =====================================================================
        // RESPONSE
        // =====================================================================
        const res = await handleWebSocketMessage(this, msg);
        promWebsocketMessagesTotal.inc({ type });
        this.sendResponse(id, type, res);
      } catch (err) {
        // Increment invalid message counter if an error occurs
        if (err instanceof KristError && (
          err.errorString === "message_too_long"
          || err.errorString === "syntax_error"
          || err.errorString === "missing_parameter"
          || err.errorString === "invalid_parameter"
        )) {
          promWebsocketMessagesTotal.inc({ type: "invalid" });
        }

        // Respond with an error message
        this.sendError(id, err);
      }
    });
  }

  async sendHello(): Promise<void> {
    this.sendPlainJson({
      ok: true,
      type: "hello",
      ...await getDetailedMotd()
    });
  }

  sendPlainJson(message: any): void {
    this.socket.send(JSON.stringify(message));
  }

  sendResponse(
    id: string | number | undefined | null,
    type: WebSocketMessageType,
    res: OutgoingWebSocketMessage
  ): void {
    this.sendPlainJson({
      ...res,
      id,
      type: "response",
      responding_to_type: type
    });
  }

  sendError(
    id: string | number | undefined | null,
    err: unknown
  ): void {
    this.sendPlainJson({
      ...errorToJson(err),
      type: "error",
      id: id ?? undefined
    });
  }

  sendKeepalive(): void {
    this.sendPlainJson({
      type: "keepalive",
      server_time: new Date().toISOString()
    });

    promWebsocketKeepalivesTotal.inc({
      type: this.isGuest ? "guest" : "authed"
    });

    // Queue the next keepalive for this connection for anywhere from 5 to 10
    // seconds in the future, to avoid sending too many keepalives at once
    const nextKeepalive = Math.floor(Math.random() * 5000) + 5000;
    if (this.keepaliveTimer) clearTimeout(this.keepaliveTimer);
    this.keepaliveTimer = setTimeout(() => this.sendKeepalive(), nextKeepalive);
  }
}
