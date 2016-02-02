var krist               = require('./../src/krist.js'),
	addresses           = require('./../src/addresses.js'),
	addressesController = require('./../src/controllers/addresses.js'),
	namesController     = require('./../src/controllers/names.js'),
	txController        = require('./../src/controllers/transactions.js')
	names               = require('./../src/names.js'),
	tx                  = require('./../src/transactions.js'),
	utils               = require('./../src/utils.js'),
	moment              = require('moment');

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
		addressesController.getAddresses(req.query.limit, req.query.offset).then(function(results) {
			var out = [];

			results.forEach(function(address) {
				out.push(addressesController.addressToJSON(address));
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
		addressesController.getRich(req.query.limit, req.query.offset).then(function(results) {
			var out = [];

			results.forEach(function(address) {
				out.push(addressesController.addressToJSON(address));
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
					address: addressesController.addressToJSON(address)
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
						out.push(namesController.nameToJSON(name));
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
		addressesController.getTransactionsByAddress(req.params.address, req.query.limit, req.query.offset).then(function(transactions) {
			var out = [];

			transactions.forEach(function (transaction) {
				out.push(txController.transactionToJSON(transaction));
			});

			res.json({
				ok: true,
				count: out.length,
				transactions: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});


	return app;
};