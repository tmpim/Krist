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

const chalk  = require("chalk");
const fs     = require("fs");
const path   = require("path");
const utils  = require("./utils.js");
const errors = require("./errors/errors.js");

const express = require("express");
const bodyParser = require("body-parser");

const { promisify } = require("util");
const crypto        = require("crypto");
const secureBytes   = promisify(crypto.randomBytes);

// =============================================================================
// PROMETHEUS COUNTERS
// =============================================================================
const promClient = require("prom-client");

const promWebsocketConnectionsTotal = new promClient.Counter({
  name: "krist_websocket_connections_total",
  help: "Total number of new websocket connections since the Krist server started.",
  labelNames: ["type"]
});
promWebsocketConnectionsTotal.inc({ type: "incomplete" }, 0);
promWebsocketConnectionsTotal.inc({ type: "guest" }, 0);
promWebsocketConnectionsTotal.inc({ type: "authed" }, 0);

const promWebsocketTokensTotal = new promClient.Counter({
  name: "krist_websocket_tokens_total",
  help: "Total number of websocket tokens created since the Krist server started.",
  labelNames: ["type"]
});
promWebsocketTokensTotal.inc({ type: "guest" }, 0);
promWebsocketTokensTotal.inc({ type: "authed" }, 0);

const promWebsocketMessagesTotal = new promClient.Counter({
  name: "krist_websocket_incoming_messages_total",
  help: "Total number of incoming websocket messages since the Krist server started.",
  labelNames: ["type"]
});

const promWebsocketEventBroadcastsTotal = new promClient.Counter({
  name: "krist_websocket_event_broadcasts_total",
  help: "Total number of websocket event broadcasts sent out since the Krist server started.",
  labelNames: ["event"]
});
// =============================================================================
// END PROMETHEUS COUNTERS
// =============================================================================

function WebsocketsManager() {
  this.websockets = [];
  this.messageHandlers = [];
  this.pendingTokens = [];

  this.validSubscriptions = ["blocks", "ownBlocks", "transactions", "ownTransactions", "names", "ownNames", "motd"];
}

function Websocket(req, socket, token, auth, subs, privatekey) {
  this.req = req;
  this.socket = socket;
  this.token = token;
  this.auth = auth;
  this.privatekey = privatekey;

  this.subs = subs || ["ownTransactions", "blocks"];

  this.isGuest = auth === "guest";
}

Websocket.prototype.send = function(message) {
  this.socket.send(message);
};

const Websockets = new WebsocketsManager();

module.exports = Websockets;
module.exports.promWebsocketConnectionsTotal = promWebsocketConnectionsTotal;

// =============================================================================
// PROMETHEUS GAUGES
// =============================================================================
new promClient.Gauge({
  name: "krist_websocket_connections_current",
  help: "Current number of active websocket connections.",
  labelNames: ["type"],
  collect() {
    const sockets = Websockets.websockets;
    this.set({ type: "guest" }, sockets.filter(w => w.isGuest).length);
    this.set({ type: "authed" }, sockets.filter(w => !w.isGuest).length);
  }
});

new promClient.Gauge({
  name: "krist_websocket_tokens_pending_current",
  help: "Current number of pending websocket tokens.",
  collect() {
    this.set(Object.keys(Websockets.pendingTokens).length);
  }
});
// =============================================================================
// END PROMETHEUS GAUGES
// =============================================================================

WebsocketsManager.prototype.addMessageHandler = function(type, handler) {
  Websockets.messageHandlers[type] = handler;
};

WebsocketsManager.prototype.addWebsocket = function(req, socket, token, auth, pkey) {
  const ws = new Websocket(req, socket, token, auth, null, pkey);
  promWebsocketConnectionsTotal.inc({ type: ws.isGuest ? "guest" : "authed" });

  socket.on("close", function() {
    const id = Websockets.websockets.indexOf(ws);

    if (id !== -1) {
      Websockets.websockets.splice(id, 1);
    }
  });

  socket.on("message", async function(message) {
    if (message.length > 512) {
      promWebsocketMessagesTotal.inc({ type: "invalid" });
      return socket.send(JSON.stringify({
        ok: false,
        type: "error",
        error: "message_too_long"
      }));
    }

    let msg;

    try {
      msg = JSON.parse(message);
    } catch (e) {
      promWebsocketMessagesTotal.inc({ type: "invalid" });
      return socket.send(JSON.stringify({
        ok: false,
        type: "error",
        error: "syntax_error"
      }));
    }

    if ((typeof msg.id !== "number" && typeof msg.id !== "string") || typeof msg.type !== "string") {
      promWebsocketMessagesTotal.inc({ type: "invalid" });
      return socket.send(JSON.stringify({
        ok: false,
        type: "error",
        error: "missing_parameter",
        parameter: typeof msg.type !== "string" ? "type" : "id"
      }));
    }

    const type = msg.type.toLowerCase();
    if (typeof Websockets.messageHandlers[type] === "undefined") {
      promWebsocketMessagesTotal.inc({ type: "invalid" });
      return Websockets.sendResponse(socket, msg, {
        ok: false,
        type: "error",
        error: "invalid_type"
      });
    }

    try {
      const response = await Websockets.messageHandlers[type](ws, msg);
      if (response) Websockets.sendResponse(socket, msg, response);
    } catch(err) {
      Websockets.sendResponse(socket, msg, utils.errorToJSON(err));
    } finally {
      promWebsocketMessagesTotal.inc({ type });
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

/** Returns a function, based on the event type, that checks whether or not a
 * given websocket should receive the event. */
function subscriptionCheck(message) {
  if (!message.event) throw new Error("Missing event type");
  
  switch (message.event) {
  case "block": {
    const { address } = message.block;
    return ws => // If the ws is subscribed to 'blocks' or 'ownBlocks'
      (!ws.isGuest && ws.auth === address && ws.subs.includes("ownBlocks")) 
      || ws.subs.includes("blocks");
  }

  case "transaction": {
    const { to, from } = message.transaction;
    return ws => // If the ws is subscribed to 'transactions' or 'ownTransactions'
      (!ws.isGuest && (ws.auth === to || ws.auth === from) && ws.subs.includes("ownTransactions")) 
      || ws.subs.includes("transactions");
  }

  case "name": {
    const { owner } = message.name;
    return ws => // If the ws is subscribed to 'names' or 'ownNames'
      (!ws.isGuest && (ws.auth === owner) && ws.subs.includes("ownNames")) 
      || ws.subs.includes("names");
  }

  default: 
    throw new Error("Unknown event type " + message.event);
  }
}

WebsocketsManager.prototype.broadcastEvent = function(message) {
  if (!message.event) throw new Error("Missing event type");
  promWebsocketEventBroadcastsTotal.inc({ event: message.event });

  const subCheck = subscriptionCheck(message);
  const stringified = JSON.stringify(message);
  
  let recipients = 0;
  Websockets.websockets.forEach(ws => {
    if (!subCheck(ws)) return;
    recipients++;

    try {
      ws.send(stringified);
    } catch (err) {
      console.error("Error sending websocket event broadcast:", err);
    }
  });
  return recipients;
};

WebsocketsManager.prototype.sendResponse = function(ws, originalMessage, message) {
  message["id"] = originalMessage.id;

  ws.send(JSON.stringify(message));
};

WebsocketsManager.prototype.obtainToken = async function(address, privatekey) {
  // Generate a new token
  // NOTE: These used to be UUIDs, so we use 18 bytes here to maintain
  //       compatibility with anything that may expect exactly 36 characters.
  const token = (await secureBytes(18)).toString("hex");
  this.pendingTokens[token] = { address, privatekey };

  promWebsocketTokensTotal.inc({ type: address === "guest" ? "guest" : "authed" });

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
  delete this.pendingTokens[token];

  return tokenData;
};

const fileExists = f => fs.promises.access(f, fs.constants.F_OK).then(() => true).catch(() => false);
WebsocketsManager.prototype.startIPC = async function() {
  console.log(chalk`{cyan [Websockets]} Starting IPC server`);
  
  const ipcPath = process.env.WS_IPC_PATH;
  if (await fileExists(ipcPath)) {
    console.log(chalk`{cyan [Websockets]} Cleaning up existing IPC socket`);
    await fs.promises.unlink(ipcPath);
  }

  const app = express();
  app.use(bodyParser.json());

  app.post("/event", async (req, res) => {
    // Primitive validation
    const { body } = req;
    if (!body.event) throw new errors.ErrorMissingParameter("event");

    let eventData;
    switch (body.event) {
    case "block":
      if (!body.block) throw new errors.ErrorMissingParameter("block");
      eventData = { block: body.block };
      break;

    case "transaction":
      if (!body.transaction) throw new errors.ErrorMissingParameter("transaction");
      eventData = { transaction: body.transaction };
      break;

    case "name":
      if (!body.name) throw new errors.ErrorMissingParameter("name");
      eventData = { name: body.name };
      break;

    default:
      throw new errors.ErrorInvalidParameter("event");
    }

    const rawEvent = {
      type: "event",
      event: body.event,
      ...eventData
    };
    const recipients = Websockets.broadcastEvent(rawEvent);

    console.log(chalk`{yellow [Websockets]} Event {bold ${body.event}} broadcast via IPC to {bold ${recipients} recipients}. Raw event:\n`, rawEvent);

    return res.json({
      ok: true,
      recipients
    });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    utils.sendErrorToRes(req, res, err);
  });

  app.listen(ipcPath, () => {
    console.log(chalk`{green [Websockets]} Started IPC server`);
  }).on("error", err => {
    console.error(chalk`{red [Websockets]} Error starting IPC:`);
    console.error(err);
  });
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
    } catch (err) {
      console.error(chalk`{red [Websockets]} Error loading route '${file}'`);
      console.error(err.stack);
    }
  });
} catch (err) {
  console.error(chalk`{red [Websockets]} Error loading routes:`);
  console.error(err.stack);
}

if (typeof process.env.WS_IPC_PATH === "string") {
  try {
    Websockets.startIPC();
  } catch(err) {
    console.error(chalk`{red [Websockets]} Error starting IPC:`);
    console.error(err);
  }
}

setInterval(function() {
  Websockets.broadcast({
    type: "keepalive",
    server_time: new Date()
  });
}, 10000);
