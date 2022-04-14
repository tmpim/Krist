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
import { WebSocket } from "ws";

import {
  WebSocketBlockEvent, WebSocketEventMessage, WebSocketNameEvent,
  WebSocketTokenData, WebSocketTransactionEvent
} from "./types";
import { WrappedWebSocket } from "./WrappedWebSocket";

import {
  promWebsocketConnectionsTotal, promWebsocketEventBroadcastsTotal,
  promWebsocketTokensTotal
} from "./prometheus";

import { ErrorInvalidWebsocketToken } from "../errors";
import { generateWebSocketToken } from "../utils";
import { subscriptionCheck } from "./subscriptionCheck";

export class WebSocketsManager {
  public sockets: WrappedWebSocket[] = [];
  public pendingTokens: Record<string, WebSocketTokenData> = {};

  addWebsocket(
    req: Request,
    socket: WebSocket,
    token: string,
    address: string | "guest",
    pkey?: string
  ): WrappedWebSocket {
    const ws = new WrappedWebSocket(req, socket, token, address, pkey);
    promWebsocketConnectionsTotal.inc({
      type: ws.isGuest ? "guest" : "authed"
    });

    socket.on("close", () => this.removeWebsocket(token));
    ws.init();

    this.sockets.push(ws);
    return ws;
  }

  removeWebsocket(token?: string): void {
    const id = this.sockets.findIndex(v => v.token === token);
    if (id !== -1) this.sockets.splice(id, 1);
  }

  async obtainToken(address: string, privatekey?: string): Promise<string> {
    // Generate a new token
    const token = await generateWebSocketToken();
    this.pendingTokens[token] = { address, privatekey };

    promWebsocketTokensTotal.inc({
      type: address === "guest" ? "guest" : "authed"
    });

    // Expire the token after 30 seconds
    setTimeout(() => {
      delete this.pendingTokens[token];
    }, 30000);

    return token;
  }

  useToken(token: string): WebSocketTokenData {
    const tokenData = this.pendingTokens[token];

    // Reject if token not found
    if (!tokenData) throw new ErrorInvalidWebsocketToken();

    // Prevent token re-use
    delete this.pendingTokens[token];

    return tokenData;
  }

  broadcastEvent(
    msg: WebSocketEventMessage | WebSocketBlockEvent
      | WebSocketTransactionEvent | WebSocketNameEvent
  ): number {
    if (!msg.event) throw new Error("Missing event type");
    promWebsocketEventBroadcastsTotal.inc({ event: msg.event });

    // Get a function based on the event type to filter which sockets to send
    // the event to
    const subCheck = subscriptionCheck(msg);

    // Only stringify the JSON once, rather than using sendJson and doing it for
    // every connection individually
    const stringified = JSON.stringify(msg);

    let recipients = 0;
    this.sockets.forEach(ws => {
      if (!subCheck(ws)) return;
      recipients++;

      try {
        ws.socket.send(stringified);
      } catch (err) {
        console.error("Error sending websocket event broadcast:", err);
      }
    });
    return recipients;
  }
}
