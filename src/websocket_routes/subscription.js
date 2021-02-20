/**
 * Created by Drew Lemmy, 2016-2021
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

const errors = require("../errors/errors");

module.exports = function(websockets) {
  /**
	 * @api {ws} //ws:"type":"subscribe" Subscribe to an event
	 * @apiName WSSubscribe
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.2
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="subscribe"} type
	 * @apiParam (WebsocketParameter) {String} event
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
  websockets.addMessageHandler("subscribe", async function(ws, message) {
    const { event } = message;
    if (!event) throw new errors.ErrorMissingParameter("event");
    if (!websockets.validSubscriptions.includes(event))
      throw new errors.ErrorInvalidParameter("event");

    if (!ws.subs.includes(event)) {
      ws.subs.push(event);
    }

    return {
      ok: true,
      subscription_level: ws.subs
    };
  });

  /**
	 * @api {ws} //ws:"type":"get_subscription_level" Get the current subscription level
	 * @apiName WSGetSubscriptionLevel
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.2
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="get_subscription_level"} type
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
  websockets.addMessageHandler("get_subscription_level", async function(ws) {
    return {
      ok: true,
      subscription_level: ws.subs
    };
  });

  /**
	 * @api {ws} //ws:"type":"get_valid_subscription_levels" Get all valid  subscription levels
	 * @apiName WSGetValidSubscriptionLevels
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.2
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="get_valid_subscription_levels"} type
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
  websockets.addMessageHandler("get_valid_subscription_levels", async () => ({
    ok: true,
    valid_subscription_levels: websockets.validSubscriptions
  }));

  /**
	 * @api {ws} //ws:"type":"unsubscribe" Unsubscribe from an event
	 * @apiName WSUnsubscribe
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.2
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="subscribe"} type
	 * @apiParam (WebsocketParameter) {String} event
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
  websockets.addMessageHandler("unsubscribe", async function(ws, message) {
    const { event } = message;
    if (!event) throw new errors.ErrorMissingParameter("event");
    if (!websockets.validSubscriptions.includes(event))
      throw new errors.ErrorInvalidParameter("event");

    if (ws.subs.includes(event))
      ws.subs.splice(ws.subs.indexOf(event), 1);

    return {
      ok: true,
      subscription_level: ws.subs
    };
  });
};
