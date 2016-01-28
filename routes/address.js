var krist  = require('./../src/krist.js'),
	utils  = require('./../src/utils.js'),
	moment = require('moment');

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

		if (typeof req.query.richapi !== 'undefined') {
			krist.getRich().then(function(addresses) {
				var out = "";

				addresses.forEach(function(address) {
					out += address.address.substr(0, 10);
					out += utils.padDigits(address.balance, 8);
					out += moment(address.firstseen).format('DD MMM YYYY');
				});

				res.send(out);
			});

			return;
		}

		if (req.query.listtx) {
			krist.getAddress(req.query.listtx).then(function(address) {
				if (address) {
					krist.getTransactionsByAddress(address.address, typeof req.query.overview !== 'undefined' ? 3 : 100).then(function(transactions) {
						var out = '';

						transactions.forEach(function (transaction) {
							out += moment(transaction.time).format('MMM DD HH:mm');

							var peer = '';
							var sign = '';

							if (transaction.to === address.address) {
								peer = transaction.from;
								sign = '+';
							} else if (transaction.from === address.address) {
								peer = transaction.to;
								sign = '-';
							}

							if (!transaction.from || transaction.from.length < 10) {
								peer = 'N/A(Mined)';
							}

							if (!transaction.to || transaction.to.length < 10) {
								peer = 'N/A(Names)';
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
					firstseen: moment(address.firstseen).format('YYYY-MM-DD HH:mm:ss').toString(),
					firstseen_unix: moment(address.firstseen).unix()
				});
			});

			res.json({
				ok: true,
				count: out.length,
				addresses: out
			});
		});
	});

	app.get('/addresses/rich', function(req, res) {
		krist.getRich().then(function(addresses) {
			var out = [];

			addresses.forEach(function(address) {
				out.push({
					address: address.address,
					balance: address.balance,
					totalin: address.totalin,
					totalout: address.totalout,
					firstseen: moment(address.firstseen).format('YYYY-MM-DD HH:mm:ss').toString(),
					firstseen_unix: moment(address.firstseen).unix()
				});
			});

			res.json({
				ok: true,
				count: out.length,
				addresses: out
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
					firstseen: moment(address.firstseen).format('YYYY-MM-DD HH:mm:ss').toString(),
					firstseen_unix: moment(address.firstseen).unix()
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
							registered: moment(name.registered).format('YYYY-MM-DD HH:mm:ss').toString(),
							registered_unix: moment(name.registered).unix(),
							updated: moment(name.updated).format('YYYY-MM-DD HH:mm:ss').toString(),
							updated_unix: moment(name.updated).unix(),
							a: name
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
							time: moment(transaction.time).format('YYYY-MM-DD HH:mm:ss').toString(),
							time_unix: moment(transaction.time).unix(),
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