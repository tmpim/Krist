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

const addr = require("./../controllers/addresses.js");

module.exports = function(websockets) {
  /**
	 * @api {ws} //ws:"type":"address" Get an address
	 * @apiName WSGetAddress
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.4
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="address"} type
	 * @apiParam (WebsocketParameter) {String} address
	 *
	 * @apiUse Address
	 */

  websockets.addMessageHandler("address", function(ws, message) {
    return new Promise(function(resolve, reject) {
      addr.getAddress(message.address).then(function(address) {
        resolve({
          ok: true,
          address: addr.addressToJSON(address)
        });
      }).catch(reject);
    });
  });
};
