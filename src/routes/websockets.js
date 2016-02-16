var krist  		= require('./../krist.js'),
	config		= require('./../../config.js'),
	utils   	= require('./../utils.js'),
	errors  	= require('./../errors/errors.js'),
	redis		= require('./../redis.js'),
	websockets	= require('./../websockets.js'),
	uuid		= require('node-uuid');

module.exports = function(app) {
	/**
	 * @apiDefine WebsocketGroup Websockets
	 *
	 * All Websocket related endpoints.
	 */

	if (!config.debugMode) {
		return;
	}

	app.ws('/:token', function(ws, req) {
		redis.getClient().getAsync('ws-' + req.params.token).then(function(wsid) {
			if (wsid) {
				utils.sendToWS(ws, {
					ok: true,
					type: "hello",
					message: "wpte;gomfrektvdefr"
				});

				websockets.addWebsocket(ws, req.params.token, wsid);

				redis.getClient().del('ws-' + req.params.token);
			} else {
				utils.sendErrorToWS(ws, new errors.ErrorInvalidWebsocketToken());

				ws.close();
			}
		}).catch(function(error) {
			utils.sendErrorToWS(ws, error);

			ws.close();
		});
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
	 * during /ws/start. It has access to most API calls, including transactions and name registration.
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
	 *     "url": "wss://krist.ceriat.net/ba90ad70-cdfa-11e5-8cca-e1d2a26eabaf"
     * }
	 */
	app.post('/ws/start', function(req, res) {
		var token = uuid.v1();

		redis.getClient().set('ws-' + token, "guest");
		redis.getClient().expire('ws-' + token, 300);

		res.json({
			ok: true,
			url: (config.websocketURL || 'wss://krist.ceriat.net') + '/' + token
		});
	});

	return app;
};