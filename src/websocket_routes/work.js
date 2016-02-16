var krist = require('./../krist.js');

module.exports = function(websockets) {
	/**
	 * @api {ws} //ws:"type":"work" Get the current work
	 * @apiName WSGetWork
	 * @apiGroup WebsocketGroup
	 * @apiVersion 2.0.1
	 *
	 * @apiParam (WebsocketParameter) {Number} id
	 * @apiParam (WebsocketParameter) {String="work"} type
	 *
	 * @apiSuccess {Number} work The current Krist work (difficulty)
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "id": 1,
	 *     "work": 18750
     * }
	 */
	websockets.addMessageHandler('work', function(ws, message) {
		return {
			ok: true,
			work: krist.getWork()
		};
	});
};