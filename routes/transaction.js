var krist = require('./../src/krist.js');

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
	});


	return app;
};