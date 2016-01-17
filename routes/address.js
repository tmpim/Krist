var krist       = require('./../src/krist.js'),
	utils       = require('./../src/utils.js'),
	dateFormat  = require('dateformat');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (req.query.getbalance) {
			krist.getAddress(req.query.getbalance).then(function(address) {
				if (address) {
					res.send(address.balance.toString());
				} else {
					res.send('Error4');
				}
			});

			return;
		}

		if (req.query.listtx) {
			krist.getAddress(req.query.listtx).then(function(address) {
				if (address) {
					krist.getTransactionsByAddress(address.address, 100).then(function(transactions) {
						var out = '';

						transactions.forEach(function (transaction) {
							out += dateFormat(new Date(transaction.time), 'mmm dd HH:MM');

							var peer = '';
							var sign = '';

							if (transaction.from.length < 10) {
								peer = 'N/A(Mined)';
							}

							if (transaction.to.length < 10) {
								peer = 'N/A(Names)';
							}

							if (transaction.to === address.address) {
								sign = '+';
							} else if (transaction.from === address.address) {
								sign = '-';
							}

							out += peer;
							out += sign;
							out += utils.padDigits(transaction.value, 8);

							if (typeof req.query.id !== 'undefined') {
								out += utils.padDigits(transaction.id, 8);
							}
						});

						out += 'end';

						res.send(out);
					});
				} else {
					res.send('Error4');
				}
			});

			return;
		}


		next();
	});

	app.get('/addresses', function(req, res) {
		if ((req.query.limit && isNaN(req.query.limit)) || (req.query.limit && req.query.limit <= 0)) {
			res.status(400).json({
				ok: false,
				error: 'invalid_limit'
			});

			return;
		}

		if ((req.query.offset && isNaN(req.query.offset)) || (req.query.offset && req.query.offset <= 0)) {
			res.status(400).json({
				ok: false,
				error: 'invalid_offset'
			});

			return;
		}

		krist.getAddresses(req.query.limit, req.query.offset).then(function(addresses) {
			var out = [];

			addresses.forEach(function(address) {
				out.push({
					address: address.address,
					balance: address.balance,
					totalin: address.totalin,
					totalout: address.totalout,
					firstseen: address.firstseen
				});
			});

			res.json({
				ok: true,
				count: out.length,
				names: out
			});
		});
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

	app.get('/address/:address/transactions', function(req, res) {
		if ((req.query.limit && isNaN(req.query.limit)) || (req.query.limit && (req.query.limit <= 0))) {
			res.status(400).json({
				ok: false,
				error: 'invalid_limit'
			});

			return;
		}

		if ((req.query.offset && isNaN(req.query.offset)) || (req.query.offset && req.query.offset <= 0)) {
			res.status(400).json({
				ok: false,
				error: 'invalid_offset'
			});

			return;
		}

		krist.getAddress(req.params.address).then(function(address) {
			if (address) {
				krist.getTransactionsByAddress(address.address, req.query.limit, req.query.offset).then(function(transactions) {
					var out = [];

					transactions.forEach(function (transaction) {
						out.push({
							id: transaction.id,
							from: transaction.from,
							to: transaction.to,
							value: transaction.value,
							time: transaction.time,
							name: transaction.name,
							op: transaction.op
						});
					});

					res.json({
						ok: true,
						count: out.length,
						transactions: out
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
};