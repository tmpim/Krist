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
	 * @apiName GetWalletVersio0n
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {Number} wallet_version The latest KristWallet version.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "wallet_version": 14
     * }
	 */
	app.get('/walletversion', function(req, res) {
		res.header('Content-Type', 'application/json');

		res.json({
			ok: true,	
			wallet_version: krist.getWalletVersion()
		});
	});

	return app;
};