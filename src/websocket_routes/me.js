/**
 * Created by Drew Lemmy, 2016
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
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

var krist       = require("./../krist.js"),
  utils       = require("./../utils.js"),
  addresses   = require("./../controllers/addresses.js");

module.exports = function(websockets) {
  /**
	 * @api {ws} //ws:"type":"me" Get information about the user
	 * @apiName WSMe
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.2
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="me"} type
	 *
	 * @apiSuccess {Boolean} isGuest Whether the current user is a guest or not
	 * @apiUse Address
	 *
	 * @apiSuccessExample {json} Success as guest
	 * {
	 *     "ok": true,
	 *     "id": 1,
	 *     "isGuest": true
     * }
	 *
	 * @apiSuccessExample {json} Success as authed user
	 * {
	 *     "ok": true,
	 *     "id": 1,
	 *     "isGuest": false,
	 *     "address": {
	 *         "address": "knggsn1d2e",
	 *         "balance": 0,
	 *         "totalin": 0,
	 *         "totalout": 0,
	 *         "firstseen": "2016-06-17T21:09:28.000Z"
	 *     }
     * }
	 */
  websockets.addMessageHandler("me", function(ws, message) {
    return new Promise(function(resolve, reject) {
      if (ws.isGuest) {
        resolve({
          ok: true,
          isGuest: true
        });
      } else {
        addresses.getAddress(ws.auth).then(function(address) {
          resolve({
            ok: true,
            isGuest: false,
            address: addresses.addressToJSON(address)
          });
        }).catch(function(error) {
          reject(error);
        });
      }
    });
  });
};
