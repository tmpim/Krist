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

import { BlockJson } from "../krist/blocks/index.js";
import { NameJson } from "../krist/names/index.js";
import { TransactionJson } from "../krist/transactions/index.js";
import { lut } from "../utils/index.js";
import { WrappedWebSocket } from "./WrappedWebSocket.js";

export type WebSocketSubscription = "blocks" | "ownBlocks" | "transactions" |
  "ownTransactions" | "names" | "ownNames" | "motd";
export const SUBSCRIPTIONS = ["blocks", "ownBlocks", "transactions",
  "ownTransactions", "names", "ownNames", "motd"];
export const VALID_SUBSCRIPTIONS = lut(SUBSCRIPTIONS);

export type WebSocketMessageType = "address" | "login" | "logout" | "me" |
  "submit_block" | "subscribe" | "get_subscription_level" |
  "get_valid_subscription_levels" | "unsubscribe" | "make_transaction" | "work";
export const MESSAGE_TYPES = ["address", "login", "logout", "me",
  "submit_block", "subscribe", "get_subscription_level",
  "get_valid_subscription_levels", "unsubscribe", "make_transaction", "work"];
export const VALID_MESSAGE_TYPES = lut(MESSAGE_TYPES);

export type WebSocketEventType = "block" | "transaction" | "name";

export type WebSocketEventHandler<T = unknown> = (
  ws: WrappedWebSocket,
  msg: IncomingWebSocketMessage & T
) => Promise<OutgoingWebSocketMessage>;

export interface WebSocketTokenData {
  address: string;
  privatekey?: string;
}

export interface IncomingWebSocketMessage {
  id: string | number;
  type: WebSocketMessageType;
}

export interface OutgoingWebSocketMessage {
  ok: boolean;
}

export interface WebSocketEventMessage extends Omit<OutgoingWebSocketMessage, "ok"> {
  type: "event";
  event: WebSocketEventType;
}

export interface WebSocketBlockEvent extends WebSocketEventMessage {
  event: "block";
  block: BlockJson;
  new_work: number;
}

export interface WebSocketTransactionEvent extends WebSocketEventMessage {
  event: "transaction";
  transaction: TransactionJson;
}

export interface WebSocketNameEvent extends WebSocketEventMessage {
  event: "name";
  name: NameJson;
}
