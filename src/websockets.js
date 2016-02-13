function Websockets() {
	this.websockets = [];
}

function Websocket(socket, token, auth) {
	this.socket = socket;
	this.token = token;
	this.auth = auth;

	this.isGuest = auth === "guest";
}

Websockets.addWebsocket = function(socket, token, auth) {
	var ws = new Websocket(socket, token, auth);

	var self = this;

	ws.on('close', function() {
		var id = self.websockets.indexOf(ws);

		if (id !== -1) {
			self.websockets.splice(id, 1);
		}
	});

	this.websockets.push();
}

Websockets.broadcast = function(message) {
	this.websockets.forEach(function(websocket) {
		websocket.send(message);
	});
}

module.exports = Websockets;