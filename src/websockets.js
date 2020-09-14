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

const chalk  = require("chalk");
const fs     = require("fs");
const path   = require("path");
const utils  = require("./utils.js");
const errors = require("./errors/errors.js");
const uuid   = require("node-uuid");

function WebsocketsManager() {
  this.websockets = [];
  this.messageHandlers = [];
  this.pendingTokens = [];

  this.validSubscriptionLevels = ["blocks", "ownBlocks", "transactions", "ownTransactions", "names", "ownNames", "motd"];
}

function Websocket(socket, token, auth, subscriptionLevel, privatekey) {
  this.socket = socket;
  this.token = token;
  this.auth = auth;
  this.privatekey = privatekey;

  this.subscriptionLevel = subscriptionLevel || ["ownTransactions", "blocks"];

  this.isGuest = auth === "guest";
}

Websocket.prototype.send = function(message) {
  this.socket.send(message);
};

const Websockets = new WebsocketsManager();

module.exports = Websockets;

WebsocketsManager.prototype.addMessageHandler = function(type, handler) {
  Websockets.messageHandlers[type] = handler;
};

WebsocketsManager.prototype.addWebsocket = function(socket, token, auth, pkey) {
  const ws = new Websocket(socket, token, auth, null, pkey);

  socket.on("close", function() {
    const id = Websockets.websockets.indexOf(ws);

    if (id !== -1) {
      Websockets.websockets.splice(id, 1);
    }
  });

  socket.on("message", function(message) {
    if (message.length > 512) {
      return socket.send(JSON.stringify({
        ok: false,
        error: "message_too_long"
      }));
    }

    let msg;

    try {
      msg = JSON.parse(message);
    } catch (e) {
      return socket.send(JSON.stringify({
        ok: false,
        error: "syntax_error"
      }));
    }

    if (typeof msg.id !== "number" && typeof msg.id !== "string") {
      return socket.send(JSON.stringify({
        ok: false,
        error: "missing_parameter",
        parameter: "id"
      }));
    }

    if (typeof Websockets.messageHandlers[msg.type.toLowerCase()] === "undefined") {
      return Websockets.sendResponse(socket, msg, {
        ok: false,
        error: "invalid_type"
      });
    }

    const response = Websockets.messageHandlers[msg.type.toLowerCase()](ws, msg);

    if (response instanceof Promise) {
      response.then(function(resp) {
        Websockets.sendResponse(socket, msg, resp);
      }).catch(function(err) {
        Websockets.sendResponse(socket, msg, utils.errorToJSON(err));
      });
    } else if (response) {
      Websockets.sendResponse(socket, msg, response);
    }
  });

  Websockets.websockets.push(ws);
};

WebsocketsManager.prototype.broadcast = function(message) {
  Websockets.websockets.forEach(function(websocket) {
    try {
      websocket.send(JSON.stringify(message));
    } catch (err) {
      console.error("Error sending websocket broadcast:", err);
    }
  });
};

WebsocketsManager.prototype.broadcastEvent = function(message, subscriptionCheck) {
  Websockets.websockets.forEach(function(websocket) {
    subscriptionCheck(websocket).then(function() {
      try {
        websocket.send(JSON.stringify(message));
      } catch (err) {
        console.error("Error sending websocket event broadcast:", err);
      }
    }).catch(function() {});
  });
};

WebsocketsManager.prototype.sendResponse = function(ws, originalMessage, message) {
  message["id"] = originalMessage.id;

  ws.send(JSON.stringify(message));
};

WebsocketsManager.prototype.obtainToken = function(address, privatekey) {
  // Generate a new token
  const token = uuid.v1();
  this.pendingTokens[token] = { address, privatekey };

  // Destroy the token after 30 seconds
  setTimeout(() => {
    delete this.pendingTokens[token];
  }, 30000);

  return token;
};

WebsocketsManager.prototype.useToken = function(token) {
  const tokenData = this.pendingTokens[token];

  // Reject if token not found
  if (!tokenData) throw new errors.ErrorInvalidWebsocketToken();

  // Prevent token re-use
  this.pendingTokens[token] = null;

  return tokenData;
};

console.log(chalk`{cyan [Websockets]} Loading routes`);

try {
  const routePath = path.join(__dirname, "websocket_routes");

  fs.readdirSync(routePath).forEach(function(file) {
    if (path.extname(file).toLowerCase() !== ".js") {
      return;
    }

    try {
      require("./websocket_routes/" + file)(module.exports);
    } catch (error) {
      console.error(chalk`{red [Websockets]} Error loading route '${file}'`);
      console.error(error.stack);
    }
  });
} catch (error) {
  console.error(chalk`{red [Websockets]} Error loading routes:`);
  console.error(error.stack);
}

setInterval(function() {
  Websockets.broadcast({
    type: "keepalive",
    server_time: new Date()
  });
}, 10000);
