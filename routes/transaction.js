var krist   = require('./../src/krist.js'),
	moment  = require('moment');

module.exports = function(app) {
	app.get('/transactions', function(req, res) {
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

		krist.getTransactions(req.query.limit, req.query.offset).then(function(transactions) {
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
	});

	app.get('/transaction/:transaction', function(req, res) {
		krist.getTransaction(Math.max(parseInt(req.params.transaction), 0)).then(function(transaction) {
			if (transaction) {
				res.json({
					ok: true,
					id: transaction.id,
					from: transaction.from,
					to: transaction.to,
					value: transaction.value,
					time: moment(transaction.time).format('YYYY-MM-DD HH:mm:ss').toString(),
					time_unix: moment(transaction.time).unix(),
					name: transaction.name,
					op: transaction.op
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