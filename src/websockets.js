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

var	fs 					= require('fs'),
	path 				= require('path'),
	utils               = require('./utils.js');

function WebsocketsManager() {
	this.websockets = [];
	this.messageHandlers = [];

	this.validSubscriptionLevels = ['blocks', 'ownBlocks', 'transactions', 'ownTransactions', 'names', 'ownNames', 'ownWebhooks', 'motd'];
}

function Websocket(socket, token, auth, subscriptionLevel) {
	this.socket = socket;
	this.token = token;
	this.auth = auth;

	this.subscriptionLevel = subscriptionLevel || ['ownTransactions', 'blocks'];

	this.isGuest = auth === "guest";
}

Websocket.prototype.send = function(message) {
	this.socket.send(message);
};

var Websockets = new WebsocketsManager();

module.exports = Websockets;

WebsocketsManager.prototype.addMessageHandler = function(type, handler) {
	Websockets.messageHandlers[type] = handler;
};

WebsocketsManager.prototype.addWebsocket = function(socket, token, auth) {
	var ws = new Websocket(socket, token, auth);

	socket.on('close', function() {
		var id = Websockets.websockets.indexOf(ws);

		if (id !== -1) {
			Websockets.websockets.splice(id, 1);
		}
	});

	socket.on('message', function(message) {
		if (message.length > 512) {
			return socket.send(JSON.stringify({
				ok: false,
				error: "message_too_long"
			}));
		}

		var msg;

		try {
			msg = JSON.parse(message);
		} catch (e) {
			return socket.send(JSON.stringify({
				ok: false,
				error: "syntax_error"
			}));
		}

		if (!msg.id) {
			return socket.send(JSON.stringify({
				ok: false,
				error: "missing_parameter",
				parameter: "id"
			}));
		}

		if (typeof Websockets.messageHandlers[msg.type.toLowerCase()] === 'undefined') {
			return Websockets.sendResponse(socket, msg, {
				ok: false,
				error: "invalid_type"
			});
		}

		var response = Websockets.messageHandlers[msg.type.toLowerCase()](ws, msg);

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
		websocket.send(JSON.stringify(message));
	});
};

WebsocketsManager.prototype.broadcastEvent = function(message, subscriptionCheck) {
	Websockets.websockets.forEach(function(websocket) {
		subscriptionCheck(websocket).then(function() {
			websocket.send(JSON.stringify(message));
		}).catch(function() {});
	});
};

WebsocketsManager.prototype.sendResponse = function(ws, originalMessage, message) {
	message['id'] = originalMessage.id;

	ws.send(JSON.stringify(message));
};

console.log('[Websockets]'.cyan + ' Loading routes');

try {
	var routePath = path.join(__dirname, 'websocket_routes');

	fs.readdirSync(routePath).forEach(function(file) {
		if (path.extname(file).toLowerCase() !== '.js') {
			return;
		}

		try {
			require('./websocket_routes/' + file)(module.exports);
		} catch (error) {
			console.log('[Websockets]'.red + ' Error loading route `' + file + '`: ');
			console.log(error.stack);
		}
	});
} catch (error) {
	console.log('[Websockets]'.red + ' Error finding routes: ');
	console.log(error.stack);
}

setInterval(function() {
	Websockets.broadcast({
		type: "keepalive",
		server_time: new Date()
	});
}, 10000);