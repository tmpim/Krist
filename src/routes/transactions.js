var krist           = require('./../krist.js'),
	addresses       = require('./../addresses.js'),
	tx              = require('./../transactions.js'),
	txController    = require('./../controllers/transactions.js'),
	utils           = require('./../utils.js'),
	moment          = require('moment');

module.exports = function(app) {
	/**
	 * @apiDefine TransactionGroup Transactions
	 *
	 * All Transactions related endpoints.
	 */

	/**
	 * @apiDefine Transaction
	 *
	 * @apiSuccess {Object} transaction
	 * @apiSuccess {Number} transaction.id The ID of this transaction.
	 * @apiSuccess {String} transaction.from The sender of this transaction.
	 * @apiSuccess {String} transaction.to The recipient of this transaction.
	 * @apiSuccess {Number} transaction.value The amount of Krist transferred in this transaction.
	 * @apiSuccess {Date} transaction.time The time this transaction this was made.
	 * @apiSuccess {String} transaction.name The name assosciated with this transaction, or null.
	 * @apiSuccess {String} transaction.op Transaction metadata, or null.
	 */

	/**
	 * @apiDefine Transactions
	 *
	 * @apiSuccess {Object[]} transactions
	 * @apiSuccess {Number} transactions.id The ID of this transaction.
	 * @apiSuccess {String} transactions.from The sender of this transaction.
	 * @apiSuccess {String} transactions.to The recipient of this transaction.
	 * @apiSuccess {Number} transactions.value The amount of Krist transferred in this transaction.
	 * @apiSuccess {Date} transactions.time The time this transaction this was made.
	 * @apiSuccess {String} transactions.name The name assosciated with this transaction, or null.
	 * @apiSuccess {String} transactions.op Transaction metadata, or null.
	 */

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
				return res.status(400).send('Error6');
			}

			if (!req.query.amt || isNaN(req.query.amt)) {
				return res.status(400).send('Error3');
			}

			if (req.query.amt < 1) {
				return res.status(400).send('Error2');
			}

			if (!req.query.q || req.query.q.length !== 10) {
				return res.status(400).send('Error4');
			}

			var from = utils.sha256(req.query.pkey).substr(0, 10);
			var amt = parseInt(req.query.amt);

			if (!krist.isValidKristAddress(req.query.q.toString())) {
				return res.status(400).send('Error4');
			}

			if (req.query.com && !/^[\x20-\x7F]+$/i.test(req.query.com)) {
				return res.status(400).send('Error5');
			}

			addresses.getAddress(from).then(function(sender) {
				if (!sender || sender.balance < amt) {
					return res.status(403).send("Error1");
				}

				tx.pushTransaction(sender, req.query.q.toString(), amt, req.query.com).then(function() {
					res.send('Success');
				});
			});

			return;
		}

		if (typeof req.query.pushtx2 !== 'undefined') {
			if (!req.query.pkey) {
				return res.status(400).send('Error6');
			}

			if (!req.query.amt || isNaN(req.query.amt)) {
				return res.status(400).send('Error3');
			}

			if (req.query.amt < 1) {
				return res.status(400).send('Error2');
			}

			if (!krist.isValidKristAddress(req.query.q.toString())) {
				return res.status(400).send('Error4');
			}

			if (req.query.com && !/^[\x20-\x7F]+$/i.test(req.query.com)) {
				return res.status(400).send('Error5');
			}

			var fromv2 = krist.makeV2Address(req.query.pkey);
			var amtv2 = parseInt(req.query.amt);

			addresses.getAddress(fromv2).then(function(sender) {
				if (!sender || sender.balance < amtv2) {
					return res.status(403).send("Error1");
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

	app.post('/transactions', function(req, res) {
		txController.makeTransaction(req.body.privatekey, req.body.to, req.body.amount, req.body.com).then(function() {
			res.json({
				ok: true
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	return app;
};
