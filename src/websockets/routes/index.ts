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

import { WebSocketEventHandler, WebSocketMessageType } from "../types";

import { ErrorInvalidParameter } from "../../errors";

import { wsGetAddress } from "./addresses";
import { wsGetMe } from "./me";
import { wsGetWork } from "./work";
import { wsMakeTransaction } from "./transactions";
import { wsSubmitBlock } from "./submission";

import {
  wsSubscribe, wsUnsubscribe,
  wsGetSubscriptionLevel, wsGetValidSubscriptionLevels
} from "./subscription";

import { wsLogin } from "./login";
import { wsLogout } from "./logout";

export const WEBSOCKET_HANDLERS: Record<WebSocketMessageType, WebSocketEventHandler<any>> = {
  "address": wsGetAddress,
  "make_transaction": wsMakeTransaction,
  "me": wsGetMe,
  "submit_block": wsSubmitBlock,
  "work": wsGetWork,

  "subscribe": wsSubscribe,
  "unsubscribe": wsUnsubscribe,
  "get_subscription_level": wsGetSubscriptionLevel,
  "get_valid_subscription_levels": wsGetValidSubscriptionLevels,

  "login": wsLogin,
  "logout": wsLogout
};

export const handleWebSocketMessage: WebSocketEventHandler = async (ws, msg) => {
  const handler = WEBSOCKET_HANDLERS[msg.type];
  if (handler) return handler(ws, msg);
  else throw new ErrorInvalidParameter("type");
};
