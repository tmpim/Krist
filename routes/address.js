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
				res.status(404).json({
					ok: false,
					error: 'not_found'
				});
			}
		});
	});

	app.get('/address/:address/names', function(req, res) {
		krist.getAddress(req.params.address).then(function(address) {
			if (address) {
				krist.getNamesByOwner(address.address).then(function(names) {
					var out = [];

					names.forEach(function (name) {
						out.push({
							name: name.name,
							owner: name.owner,
							registered: name.registered,
							updated: name.updated,
							a: name.a
						});
					});

					res.json({
						ok: true,
						count: out.length,
						names: out
					});
				});
			} else {
				res.status(404).json({
					ok: false,
					error: 'not_found'
				});
			}
		});
	});

	return app;
}