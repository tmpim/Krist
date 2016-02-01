var krist           = require('./../src/krist.js'),
	addresses       = require('./../src/addresses.js'),
	addressesAPI    = require('./../src/api/addresses.js'),
	names           = require('./../src/names.js'),
	tx              = require('./../src/transactions.js'),
	utils           = require('./../src/utils.js'),
	moment          = require('moment');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (req.query.getbalance) {
			addresses.getAddress(req.query.getbalance).then(function(address) {
				if (address) {
					res.send(address.balance.toString());
				} else {
					res.send('0');
				}
			});

			return;
		}

		if (typeof req.query.richapi !== 'undefined') {
			addresses.getRich().then(function(results) {
				var out = "";

				results.forEach(function(address) {
					out += address.address.substr(0, 10);
					out += utils.padDigits(address.balance, 8);
					out += moment(address.firstseen).format('DD MMM YYYY');
				});

				res.send(out);
			});

			return;
		}

		if (req.query.listtx) {
			addresses.getAddress(req.query.listtx).then(function(address) {
				if (address) {
					tx.getTransactionsByAddress(address.address, typeof req.query.overview !== 'undefined' ? 3 : 500).then(function(results) {
						var out = '';

						results.forEach(function (transaction) {
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
		addressesAPI.getAddresses(req.query.limit, req.query.offset).then(function(results) {
			var out = [];

			results.forEach(function(address) {
				out.push(addressesAPI.addressToJSON(address));
			});

			res.json({
				ok: true,
				count: out.length,
				addresses: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	app.get('/addresses/rich', function(req, res) {
		addressesAPI.getRich(req.query.limit, req.query.offset).then(function(results) {
			var out = [];

			results.forEach(function(address) {
				out.push(addressesAPI.addressToJSON(address));
			});

			res.json({
				ok: true,
				count: out.length,
				addresses: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	app.get('/address/:address', function(req, res) {
		addresses.getAddress(req.params.address).then(function(address) {
			if (address) {
				res.json({
					ok: true,
					address: addressesAPI.addressToJSON(address)
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
		addresses.getAddress(req.params.address).then(function(address) {
			if (address) {
				names.getNamesByOwner(address.address).then(function(results) {
					var out = [];

					results.forEach(function (name) {
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

		addresses.getAddress(req.params.address).then(function(address) {
			if (address) {
				tx.getTransactionsByAddress(address.address, req.query.limit, req.query.offset).then(function(transactions) {
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