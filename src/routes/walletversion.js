var krist = require('./../krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.getwalletversion !== 'undefined') {
			return res.send(krist.getWalletVersion().toString());
		}

		next();
	});

	/**
	 * @api {get} /walletversion Get latest KristWallet version
	 * @apiName GetWalletVersion
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {Number} walletVersion The latest KristWallet version.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "walletVersion": 14
     * }
	 */
	app.get('/walletversion', function(req, res) {
		res.header('Content-Type', 'application/json');

		res.json({
			ok: true,	
			walletVersion: krist.getWalletVersion()
		});
	});

	return app;
};