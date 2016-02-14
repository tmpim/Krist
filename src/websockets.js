var fs 		= require('fs'),
	path 	= require('path');

function Websockets() {
	this.websockets = [];
	this.messageHandlers = [];
}

function Websocket(socket, token, auth) {
	this.socket = socket;
	this.token = token;
	this.auth = auth;

	this.isGuest = auth === "guest";
}

Websockets.addMessageHandler = function(type, handler) {
	this.messageHandlers[type] = handler;
};

Websockets.addWebsocket = function(socket, token, auth) {
	var ws = new Websocket(socket, token, auth);

	var self = this;

	ws.on('close', function() {
		var id = self.websockets.indexOf(ws);

		if (id !== -1) {
			self.websockets.splice(id, 1);
		}
	});

	this.websockets.push(ws);
};

Websockets.broadcast = function(message) {
	this.websockets.forEach(function(websocket) {
		websocket.send(message);
	});
};

module.exports = Websockets;

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