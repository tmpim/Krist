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

const krist     = require("./../krist.js");
const addresses = require("./../addresses.js");
const addr      = require("./../controllers/addresses.js");
const errors    = require("./../errors/errors.js");
const utils     = require("../utils");
const chalk     = require("chalk");

module.exports = function(websockets) {
  /**
	 * @api {ws} //ws:"type":"login" Login to a wallet (upgrade connection)
	 * @apiName WSLogin
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.3
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="login"} type
	 * @apiParam (WebsocketParameter) {String} privatekey
	 *
	 * @apiSuccess {Boolean} isGuest Whether the current user is a guest or not
	 * @apiUse Address
	 */
  websockets.addMessageHandler("login", async function(ws, message) {
    const { logDetails } = utils.getLogDetails(ws.req);

    const privatekey = message.privatekey;
    if (!privatekey) throw new errors.ErrorMissingParameter("privatekey");

    const { address, authed } = await addresses.verify(ws.req, krist.makeV2Address(privatekey), privatekey);

    if (authed) {
      console.log(chalk`{cyan [Websockets]} Session {bold ${ws.auth}} logged in as {bold ${address.address}} ${logDetails}`);

      ws.auth = address.address;
      ws.privatekey = message.privatekey;
      ws.isGuest = false;

      return {
        ok: true,
        isGuest: false,
        address: addr.addressToJSON(address)
      };
    } else {
      console.log(chalk`{red [Websockets]} Session {bold ${ws.auth}} failed login as {bold ${address.address}} ${logDetails}`);

      ws.auth = "guest";
      ws.isGuest = true;

      return {
        ok: true,
        isGuest: true
      };
    }
  });
};
