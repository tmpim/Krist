var krist = require('./../src/krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.getwalletversion !== 'undefined') {
			res.send(krist.getWalletVersion().toString());

			return;
		}

		next();
	});

	app.get('/walletversion', function(req, res) {
		res.header('Content-Type', 'application/json');

		res.json({
			ok: true,
			walletversion: krist.getWalletVersion()
		});
	});

	return app;
}