var krist = require('./../krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.getwork !== 'undefined') {
			return res.send(krist.getWork().toString());
		}

		next();
	});

	/**
	 * @api {get} /work Get the current work
	 * @apiName GetWork
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {Number} work The current Krist work (difficulty)
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "work": 18750
     * }
	 */
	app.get('/work', function(req, res) {
		res.header('Content-Type', 'application/json');

		res.json({
			ok: true,
			work: krist.getWork()
		});
	});

	return app;
};