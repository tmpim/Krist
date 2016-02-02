var krist           = require('./../src/krist.js'),
	addresses       = require('./../src/addresses.js'),
	tx              = require('./../src/transactions.js'),
	txController    = require('./../src/controllers/transactions.js'),
	utils           = require('./../src/utils.js'),
	schemas         = require('./../src/schemas.js'),
	moment          = require('moment');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.recenttx !== 'undefined') {
			tx.getRecentTransactions().then(function(transactions) {
				var out = '';

				transactions.forEach(function (transaction) {
					out += moment(transaction.time).format('MMM DD HH:mm');

					out += transaction.from;
					out += transaction.to;

					out += utils.padDigits(Math.abs(transaction.value), 8);
				});

				res.send(out);
			});

			return;
		}

		if (typeof req.query.pushtx !== 'undefined') {
			if (!req.query.pkey) {
				res.status(400).send('Invalid address'); // liggy said so :)))))))))))))))

				return;
			}

			if (!req.query.amt || isNaN(req.query.amt)) {
				res.status(400).send('Error3');

				return;
			}

			if (req.query.amt < 1) {
				res.status(400).send('Error2');

				return;
			}

			if (!req.query.q || req.query.q.length !== 10) {
				res.status(400).send('Error4');

				return;
			}

			var from = utils.sha256(req.query.pkey).substr(0, 10);
			var amt = parseInt(req.query.amt);

			if (!krist.isValidKristAddress(req.query.q.toString())) {
				res.status(400).send('Error4');

				return;
			}

			if (req.query.com && !/^[\x20-\x7F]+$/i.test(req.query.com)) {
				res.status(400).send('Error5');

				return;
			}

			addresses.getAddress(from).then(function(sender) {
				if (!sender || sender.balance < amt) {
					res.status(403).send("Error1");

					return;
				}

				tx.pushTransaction(sender, req.query.q.toString(), amt, req.query.com).then(function() {
					res.send('Success');
				});
			});

			return;
		}

		if (typeof req.query.pushtx2 !== 'undefined') {
			if (!req.query.pkey) {
				res.status(400).send('Invalid address'); // liggy said so :)))))))))))))))

				return;
			}

			if (!req.query.amt || isNaN(req.query.amt)) {
				res.status(400).send('Error3');

				return;
			}

			if (req.query.amt < 1) {
				res.status(400).send('Error2');

				return;
			}

			if (!req.query.q || req.query.q.length !== 10) {
				res.status(400).send('Error4');

				return;
			}

			var fromv2 = krist.makeV2Address(req.query.pkey);
			var amtv2 = parseInt(req.query.amt);

			if (fromv2.toLowerCase() === "a5dfb396d3") {
				res.status(403).send('Error5');

				return;
			}

			if (!krist.isValidKristAddress(req.query.q.toString())) {
				res.status(400).send('Error4');

				return;
			}

			if (req.query.com && !/^[\x20-\x7F]+$/i.test(req.query.com)) {
				res.status(400).send('Error5');

				return;
			}

			addresses.getAddress(fromv2).then(function(sender) {
				if (!sender || sender.balance < amtv2) {
					res.status(403).send("Error1");

					return;
				}

				tx.pushTransaction(sender, req.query.q.toString(), amtv2, req.query.com).then(function() {
					res.send('Success');
				});
			});

			return;
		}

		next();
	});

	app.get('/transactions', function(req, res) {
		txController.getTransactions(req.query.limit, req.query.offset, typeof req.query.asc !== 'undefined').then(function(transactions) {
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

	app.get('/transaction/:id', function(req, res) {
		txController.getBlock(req.params.id).then(function(transaction) {
			res.json({
				ok: true,
				block: txController.transactionToJSON(transaction)
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	return app;
};
