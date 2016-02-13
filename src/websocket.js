function Websocket(socket, token, auth) {
	this.socket = socket;
	this.token = token;
	this.auth = auth;

	this.isGuest = auth === "guest";
};