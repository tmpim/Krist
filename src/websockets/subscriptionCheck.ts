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

import { WrappedWebSocket } from "./WrappedWebSocket";
import {
  WebSocketBlockEvent, WebSocketEventMessage, WebSocketNameEvent,
  WebSocketTransactionEvent
} from "./types";

/** Returns a function, based on the event type, that checks whether or not a
 * given websocket should receive the event. */
export function subscriptionCheck(
  msg: WebSocketEventMessage
): (ws: WrappedWebSocket) => boolean {
  if (!msg.event) throw new Error("Missing event type");

  switch (msg.event) {
  // If the ws is subscribed to 'blocks' or 'ownBlocks'
  case "block": {
    const { address } = (msg as WebSocketBlockEvent).block;
    return ws =>
      (!ws.isGuest && ws.address === address && ws.subs.includes("ownBlocks"))
      || ws.subs.includes("blocks");
  }

  // If the ws is subscribed to 'transactions' or 'ownTransactions'
  case "transaction": {
    const { to, from } = (msg as WebSocketTransactionEvent).transaction;
    return ws =>
      (
        !ws.isGuest
        && (ws.address === to || ws.address === from)
        && ws.subs.includes("ownTransactions")
      )
      || ws.subs.includes("transactions");
  }

  // If the ws is subscribed to 'names' or 'ownNames'
  case "name": {
    const { owner } = (msg as WebSocketNameEvent).name;
    return ws =>
      (!ws.isGuest && (ws.address === owner) && ws.subs.includes("ownNames"))
      || ws.subs.includes("names");
  }

  default:
    throw new Error("Unknown event type " + msg.event);
  }
}
