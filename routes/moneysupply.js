var krist   = require('./../src/krist.js');

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

	app.get('/supply', function(req, res) {
		krist.getMoneySupply().then(function(supply) {
			res.json({
				ok: true,
				money_supply: supply,
			});
		});
	});

	return app;
}