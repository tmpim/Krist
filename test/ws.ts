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
import WebSocketAsPromised from "websocket-as-promised";
import * as websocket from "websocket";
import { api } from "./api.js";
import { IncomingWebSocketMessage, OutgoingWebSocketMessage } from "../src/websockets/types.js";
import { Optional } from "utility-types";

export interface TestWebSocketInitFn {
  (ws: WrappedTestWebSocket, wsp: WebSocketAsPromised): void;
}

export interface TestIncomingWebSocketMessage extends OutgoingWebSocketMessage {
  id?: number;
}
export type TestOutgoingWebSocketMessage =
  Optional<IncomingWebSocketMessage, "id">;

export class WrappedTestWebSocket {
  public messageId = 1;
  public messageResponses: Record<number, {
    resolve: (data: TestIncomingWebSocketMessage) => void;
    reject: () => void;
  }> = {};

  public finalClosed = false;

  public wsp: WebSocketAsPromised;

  constructor(
    public url: string,
    public init?: TestWebSocketInitFn
  ) {
    this.wsp = new WebSocketAsPromised(url, {
      createWebSocket: u => new websocket.default.w3cwebsocket(u) as any,
      packMessage: data => JSON.stringify(data),
      unpackMessage: data => JSON.parse(data.toString())
    });

    this.wsp.onUnpackedMessage.addListener(this.handleMessage.bind(this));

    // Allow the test to add its own message handlers before the connection
    // is opened
    if (init) init(this, this.wsp);
  }

  handleMessage(data: TestIncomingWebSocketMessage): void {
    if (data.id) {
      const handler = this.messageResponses[data.id];
      if (!handler) {
        console.error(chalkT`{red [Tests]} Websocket message had id {bold ${data.id}} (type: {bold ${typeof data.id}}) which we did not have a handler for!`, data);
        return;
      }

      handler.resolve(data);
      delete this.messageResponses[data.id];
    }
  }

  sendAndWait<OutT extends TestOutgoingWebSocketMessage>(
    data: OutT
  ): Promise<any> {
    return new Promise<TestIncomingWebSocketMessage>((resolve, reject) => {
      const id = ++this.messageId;
      const message = { id, ...data }; // Allow 'data' to overwrite the ID

      this.messageResponses[id] = {
        resolve: resolve as (d: TestIncomingWebSocketMessage) => void,
        reject
      };

      this.wsp.sendPacked(message);
    });
  }

  close(): void {
    // Close after 100ms to allow the server to send whatever it has to
    setTimeout(() => {
      if (!this.finalClosed && this.wsp && this.wsp.isOpened
        && !this.wsp.isClosing && !this.wsp.isClosed) {
        this.wsp.close();
        this.finalClosed = true;
      }
    }, 100).unref();
  }
}

export async function newConnection(
  privatekey?: string,
  init?: TestWebSocketInitFn
): Promise<WrappedTestWebSocket> {
  const res = await api().post("/ws/start").send({ privatekey });
  const ws = new WrappedTestWebSocket(res.body.url, init);
  await ws.wsp.open();

  setTimeout(() => {
    // Close after 2 seconds (the default test timeout) just in case it wasn't
    // done manually
    if (ws) ws.close();
  }, 2000);

  return ws;
}
