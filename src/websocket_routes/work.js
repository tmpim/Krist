var krist = require('./../krist.js');

module.exports = function(websockets) {
	/**
	 * @api {ws} work Get the current work
	 * @apiName WSGetWork
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.1
	 *
	 *
	 *
	 * @apiSuccess {Number} work The current Krist work (difficulty)
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "work": 18750
     * }
	 */
	websockets.addMessageHandler('work', function(ws, message, id) {
		res.json({
			ok: true,
			work: krist.getWork()
		});
	});

	return app;
};