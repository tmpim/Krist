var	fs 					= require('fs'),
	path 				= require('path');

function WebsocketsManager() {
	this.websockets = [];
	this.messageHandlers = [];
}

function Websocket(socket, token, auth) {
	this.socket = socket;
	this.token = token;
	this.auth = auth;

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

		Websockets.sendResponse(socket, msg, Websockets.messageHandlers[msg.type.toLowerCase()](ws, msg));
	});

	Websockets.websockets.push(ws);
};

WebsocketsManager.prototype.broadcast = function(message) {
	Websockets.websockets.forEach(function(websocket) {
		websocket.send(JSON.stringify(message));
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