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

import { ErrorInvalidParameter, ErrorMissingParameter } from "../../errors";
import {
  VALID_SUBSCRIPTIONS, WebSocketEventHandler, WebSocketSubscription
} from "../types";

/**
 * @api {ws} //ws:"type":"subscribe" Subscribe to an event
 * @apiName WSSubscribe
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.2
 *
 * @apiBody {Number} id
 * @apiBody {String="subscribe"} type
 * @apiBody {String} event
 *
 * @apiSuccess {String[]} subscription_level The current subscription level
 *
 * @apiSuccessExample {json} Success
 * {
 *     "ok": true,
 *     "id": 1,
 *     "subscription_level": ["ownTransactions", "blocks", "motd"]
 * }
 */
export const wsSubscribe: WebSocketEventHandler<{
  event?: string;
}> = async (ws, { event }) => {
  if (!event) throw new ErrorMissingParameter("event");
  if (!VALID_SUBSCRIPTIONS[event])
    throw new ErrorInvalidParameter("event");

  const sub = event as WebSocketSubscription;
  if (!ws.subs.includes(sub)) ws.subs.push(sub);

  return {
    ok: true,
    subscription_level: ws.subs
  };
};

/**
 * @api {ws} //ws:"type":"get_subscription_level" Get the current subscription level
 * @apiName WSGetSubscriptionLevel
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.2
 *
 * @apiBody {Number} id
 * @apiBody {String="get_subscription_level"} type
 *
 * @apiSuccess {String[]} subscription_level The current subscription level
 *
 * @apiSuccessExample {json} Success
 * {
 *     "ok": true,
 *     "id": 1,
 *     "subscription_level": ["ownTransactions", "blocks"]
 * }
 */
export const wsGetSubscriptionLevel: WebSocketEventHandler = async ws => {
  return {
    ok: true,
    subscription_level: ws.subs
  };
};

/**
 * @api {ws} //ws:"type":"get_valid_subscription_levels" Get all valid  subscription levels
 * @apiName WSGetValidSubscriptionLevels
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.2
 *
 * @apiBody {Number} id
 * @apiBody {String="get_valid_subscription_levels"} type
 *
 * @apiSuccess {String[]} valid_subscription_levels All valid subscription levels
 *
 * @apiSuccessExample {json} Success
 * {
 *     "ok": true,
 *     "id": 1,
 *     "valid_subscription_levels": ["blocks", "ownBlocks", "transactions", "ownTransactions", "names", "ownNames","motd"]
 * }
 */
export const wsGetValidSubscriptionLevels: WebSocketEventHandler = async () => {
  return {
    ok: true,
    valid_subscription_levels: Object.keys(VALID_SUBSCRIPTIONS)
  };
};

/**
 * @api {ws} //ws:"type":"unsubscribe" Unsubscribe from an event
 * @apiName WSUnsubscribe
 * @apiGroup WebsocketGroup
 * @apiVersion 2.0.2
 *
 * @apiBody {Number} id
 * @apiBody {String="subscribe"} type
 * @apiBody {String} event
 *
 * @apiSuccess {String[]} subscription_level The current subscription level
 *
 * @apiSuccessExample {json} Success
 * {
 *     "ok": true,
 *     "id": 1,
 *     "subscription_level": ["blocks"]
 * }
 */
export const wsUnsubscribe: WebSocketEventHandler<{
  event?: string;
}> = async (ws, { event }) => {
  if (!event) throw new ErrorMissingParameter("event");
  if (!VALID_SUBSCRIPTIONS[event])
    throw new ErrorInvalidParameter("event");

  const sub = event as WebSocketSubscription;
  if (ws.subs.includes(sub)) ws.subs.splice(ws.subs.indexOf(sub), 1);

  return {
    ok: true,
    subscription_level: ws.subs
  };
};
