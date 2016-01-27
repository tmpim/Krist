var krist   = require('./../src/krist.js'),
	utils   = require('./../src/utils.js'),
	schemas = require('./../src/schemas.js'),
	moment  = require('moment');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.recenttx !== 'undefined') {
			krist.getRecentTransactions().then(function(transactions) {
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

			if (from.toLowerCase() === "a5dfb396d3") {
				res.status(403).send('Error5');

				return;
			}

			if (!/^(?:k[a-z0-9]{9}|[a-f0-9]{10})$/i.test(req.query.q.toString())) {
				res.status(400).send('Error4');

				return;
			}

			if (req.query.com && !/^[\x20-\x7F]+$/i.test(req.query.com)) {
				res.status(400).send('Error5');

				return;
			}

			krist.getAddress(from).then(function(sender) {
				if (!sender || sender.balance < amt) {
					res.status(403).send("Error1");

					return;
				}

				krist.pushTransaction(sender, req.query.q.toString(), amt, req.query.com).then(function() {
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

			var from = krist.makeV2Address(req.query.pkey);
			var amt = parseInt(req.query.amt);

			if (from.toLowerCase() === "a5dfb396d3") {
				res.status(403).send('Error5');

				return;
			}

			if (!/^(?:k[a-z0-9]{9}|[a-f0-9]{10})$/i.test(req.query.q.toString())) {
				res.status(400).send('Error4');

				return;
			}

			if (req.query.com && !/^[\x20-\x7F]+$/i.test(req.query.com)) {
				res.status(400).send('Error5');

				return;
			}

			krist.getAddress(from).then(function(sender) {
				if (!sender || sender.balance < amt) {
					res.status(403).send("Error1");

					return;
				}

				krist.pushTransaction(sender, req.query.q.toString(), amt, req.query.com).then(function() {
					res.send('Success');
				});
			});

			return;
		}

		next();
	});

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

		krist.getTransactions(req.query.limit, req.query.offset, typeof req.query.asc !== 'undefined').then(function(transactions) {
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