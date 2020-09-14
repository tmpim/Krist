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

const krist       = require("./../krist.js"),
  utils       = require("./../utils.js"),
  addresses   = require("./../addresses.js");

module.exports = function(websockets) {
  /**
	 * @api {ws} //ws:"type":"logout" Log out back to guest (downgrade connection)
	 * @apiName WSLogout
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.3
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="logout"} type
	 *
	 * @apiSuccess {Boolean} isGuest Whether the current user is a guest or not
	 */
  websockets.addMessageHandler("logout", function(ws, message) {
    ws.auth = "guest";
    ws.isGuest = true;

    return {
      ok: true,
      isGuest: true
    };
  });
};
