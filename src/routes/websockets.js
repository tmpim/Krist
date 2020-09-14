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

const krist      = require("./../krist.js");
const config     = require("./../../config.js");
const utils      = require("./../utils.js");
const errors     = require("./../errors/errors.js");
const websockets = require("./../websockets.js");
const addresses  = require("./../addresses.js");
const blocks     = require("./../controllers/blocks.js");
const chalk      = require("chalk");

module.exports = function(app) {
  /**
	 * @apiDefine WebsocketGroup Websockets
	 *
	 * All Websocket related endpoints.
	 */

  app.ws("/:token", async function(ws, req) {
    try {
      // Look up the token, will reject if the token does not exist
      const { token } = req.params;
      const { address, privatekey } = websockets.useToken(token);

      console.log(chalk`{cyan [Websockets]} Incoming connection for {bold ${address}} from {bold ${req.connection.remoteAddress}} (origin: {bold ${req.header("Origin")}})`);
      websockets.addWebsocket(ws, token, address, privatekey);

      const lastBlock = await blocks.getLastBlock();
      const { motd, motd_set, debug_mode } = await krist.getMOTD();
      // Send the hello message containing the MOTD and last block
      utils.sendToWS(ws, {
        ok: true,
        type: "hello",
        server_time: new Date(),
        motd, motd_set, debug_mode,
        last_block: blocks.blockToJSON(lastBlock),
        work: krist.getWork()
      });
    } catch (error) {
      utils.sendErrorToWS(ws, error);
      console.error(error);

      ws.close();
    }
  });

  /**
	 * @api {post} /ws/start Initiate a websocket connection
	 * @apiName WebsocketStart
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription The token returned by this method will expire after 30 seconds. You will have to connect to the
	 * supplied URL within that time frame.
	 *
	 * There are two types of websockets:
	 *
	 * * Guest Sessions
	 * * Authed Sessions
	 *
	 * A **guest session** is a session without a privatekey. It has access to basic API calls such as getters and
	 * submitblock.
	 *
	 * An **authed session** is a session linked to an address. The privatekey is supplied as a POST body parameter
	 * during /ws/start. It has access to most API calls, including transactions and name registration. **Authed
	 * websockets only work with v2 addresses.**
	 *
	 * You can also upgrade from a guest session to an authed session using the method `upgrade`. See the websocket
	 * documentation for further information.
	 *
	 * ## Requests and responses
	 *
	 * The websockets follow a specific request-response subprotocol. Messages sent to a websocket must always be in
	 * a valid JSON format (prettified/minified does not matter), and must supply an `id` and `type` parameter.
	 *
	 * `id` should be unique. When the server responds to you message, it will respond back with the same ID. This is
	 * so that you know which messages the server is responding to.
	 *
	 * `type` must be any valid message type specified in the documentation below.
	 *
	 * ## Keep-alive
	 *
	 * Every 10 seconds, the server will broadcast a keep-alive event with the type `keepalive` to all clients.
	 * This is simply to maintain connections from clients which automatically close the socket after inactivity.
	 * Your client does not need to interpret these events in any way, and can completely disregard them.
	 *
	 * ## Subscription Levels
	 *
	 * There are several subscription levels for events that are broadcasted to all clients. When you are subscribed
	 * to an event you will automatically receive a message with the type `event` in a format similar to the following:
	 *
	 *     { "type": "event", "event": "block",  "block": { ... }, "new_work": 100000 }
	 *
	 * You can unsubscribe and subscribe to certain events to only receive what you wish to.
	 *
	 * ### Subscription Levels & Event List
	 *
	 * | Subscription Name |     Events    |                                       Description                                      |
	 * |:-----------------:|:-------------:|:--------------------------------------------------------------------------------------:|
	 * |      `blocks`     |    `block`    | Block events whenever a block is mined by anybody on the node                          |
	 * |    `ownBlocks`    |    `block`    | Block events whenever the authed user mines a block                                    |
	 * |   `transactions`  | `transaction` | Transaction events whenever a transaction is made by anybody on the node               |
	 * | `ownTransactions` | `transaction` | Transaction events whenever a transaction is made to or from the authed user           |
	 * |      `names`      |     `name`    | Name events whenever a name is created, modified or transferred by anybody on the node |
	 * |     `ownNames`    |     `name`    | Name events whenever the authed user creates, modifies or transfers a name             |
	 * |       `motd`      |     `motd`    | Event fired whenever the message of the day changes                                    |
	 *
	 * ## Examples
	 *
	 *
	 *
	 * @apiParam (BodyParameter) {String} [privatekey] The privatekey to authenticate with.
	 *
	 * @apiSuccess {String} url The address to connect to
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "url": "wss://krist.ceriat.net/ba90ad70-cdfa-11e5-8cca-e1d2a26eabaf",
	 *     "expires": 30
     * }
	 */
  app.post("/ws/start", function(req, res) {
    const { privatekey } = req.body;

    if (privatekey) { // Auth as address if privatekey provided
      addresses.verify(krist.makeV2Address(privatekey), privatekey).then(function(results) {
        const { authed, address } = results;

        if (!authed)
          return utils.sendErrorToRes(req, res, new errors.ErrorAuthFailed());
        
        const token = websockets.obtainToken(address.address, privatekey);

        res.json({
          ok: true,
          url: (config.websocketURL || "wss://krist.ceriat.net") + "/" + token,
          expires: 30
        });
      });
    } else { // Auth as guest if no privatekey provided
      const token = websockets.obtainToken("guest");

      res.json({
        ok: true,
        url: (config.websocketURL || "wss://krist.ceriat.net") + "/" + token,
        expires: 30
      });
    }
  });

  return app;
};
