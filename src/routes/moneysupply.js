var krist   = require('./../krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.getmoneysupply !== 'undefined') {
			krist.getMoneySupply().then(function(supply) {
				res.send(supply);
			});

			return;
		}

		next();
	});

	/**
	 * @api {get} /supply Get the money supply
	 * @apiName GetMoneySupply
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Returns the amount of Krist currently in circulation.
	 *
	 * @apiSuccess {Number} money_supply The amount of Krist in circulation.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "money_supply": 1013359534
     * }
	 */
	app.get('/supply', function(req, res) {
		krist.getMoneySupply().then(function(supply) {
			res.json({
				ok: true,
				money_supply: supply
			});
		});
	});

	return app;
};