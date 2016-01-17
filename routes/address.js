var krist = require('./../src/krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (req.query.getbalance) {
			krist.getAddress(req.query.getbalance).then(function(address) {
				if (address) {
					res.send(address.balance.toString());
				} else {
					res.send('0');
				}
			});
			return;
		}

		next();
	});

	app.get('/address/:address', function(req, res) {
		krist.getAddress(req.params.address).then(function(address) {
			if (address) {
				res.json({
					ok: true,
					address: address.address,
					balance: address.balance,
					totalin: address.totalin,
					totalout: address.totalout,
					firstseen: address.firstseen
				});
			} else {
				res.json({
					ok: false,
					error: 'not_found'
				});
			}
		});
	});

	return app;
}