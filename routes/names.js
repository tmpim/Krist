var krist       = require('./../src/krist.js'),
	addresses   = require('./../src/addresses.js'),
	tx          = require('./../src/transactions.js'),
	names       = require('./../src/names.js'),
	moment      = require('moment');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.dumpnames !== 'undefined') {
			names.getNames().then(function(results) {
				var out = '';

				results.forEach(function(name) {
					out += name.name + ';';
				});

				res.send(out);
			});

			return;
		}

		if (req.query.a) {
			names.getNameByName(req.query.a).then(function (name) {
				if (name) {
					res.send(name.a);
				} else {
					res.send("");
				}
			});

			return;
		}

		if (req.query.getowner) {
			names.getNameByName(req.query.getwoenr).then(function (name) {
				if (name) {
					res.send(name.owner);
				} else {
					res.send("");
				}
			});

			return;
		}

		if (typeof req.query.name_cost !== 'undefined') {
			res.send(names.getNameCost().toString());

			return;
		}

		if (typeof req.query.namebonus !== 'undefined') {
			names.getUnpaidNameCount().then(function(count) {
				res.send(count.toString());
			});

			return;
		}

		if (req.query.getnames) {
			addresses.getAddress(req.query.getnames).then(function(address) {
				if (address) {
					names.getNameCountByAddress(address.address).then(function(count) {
						res.send(count.toString());
					});
				} else {
					res.status(404).send('0');
				}
			});

			return;
		}

		if (req.query.listnames) {
			addresses.getAddress(req.query.listnames).then(function(address) {
				if (address) {
					names.getNamesByAddress(address.address).then(function(results) {
						var out = '';

						results.forEach(function(name) {
							out += name.name + ';';
						});

						res.send(out);
					});
				} else {
					res.status(404).send('Error4');
				}
			});

			return;
		}

		if (typeof req.query.getnewdomains !== 'undefined') {
			names.getUnpaidNames().then(function(results) {
				var out = '';

				results.forEach(function(name) {
					out += name.name + ';';
				});

				res.send(out);
			});

			return;
		}

		if (req.query.name_check) {
			if (!/^[a-zA-Z0-9]+$/.test(req.query.name_check)) {
				res.send("0");

				return;
			}

			if (req.query.name_check.length > 64 || req.query.name_check.length < 1) {
				res.send("0");

				return;
			}

			names.getNameByName(req.query.name_check).then(function (name) {
				if (name) {
					res.send("0");
				} else {
					res.send("01"); // look at Taras's code and you'll know why :^)
				}
			});

			return;
		}

		if (typeof req.query.name_new !== 'undefined') {
			if (!req.query.name || !req.query.pkey) {
				res.status(400).send('Error6');

				return;
			}

			if (!/^[a-zA-Z0-9]+$/.test(req.query.name)) {
				res.status(400).send('Error6');

				return;
			}

			if (req.query.name.length > 64 || req.query.name.length < 1) {
				res.status(400).send('Error6');

				return;
			}

			var desiredName = req.query.name.toLowerCase();

			names.getNameByName(desiredName).then(function(name) {
				if (name) {
					res.status(409).send('Error5');
				} else {
					addresses.getAddress(krist.makeV2Address(req.query.pkey)).then(function(address) {
						if (!address || address.balance < names.getNameCost()) {
							res.status(403).send('Error1');

							return;
						}

						address.decrement({ balance: names.getNameCost() });
						address.increment({ totalout: names.getNameCost() });

						tx.createTransaction('name', address.address, names.getNameCost(), desiredName, null);
						names.createName(desiredName, address.address).then(function() {
							res.send('Success');
						});
					});
				}
			});

			return;
		}

		if (typeof req.query.name_transfer !== 'undefined') {
			if (!req.query.name || !req.query.pkey) {
				res.status(400).send('Error6');

				return;
			}

			if (!/^[a-zA-Z0-9]+$/.test(req.query.name)) {
				res.status(400).send('Error6');

				return;
			}

			if (req.query.name.length > 64 || req.query.name.length < 1) {
				res.status(400).send('Error6');

				return;
			}

			if (!req.query.q || !krist.isKristAddress(req.query.q)) {
				res.status(400).send('Error4');

				return;
			}

			var currentOwner = krist.makeV2Address(req.query.pkey);

			names.getNameByName(req.query.name.toLowerCase()).then(function(name) {
				if (!name || name.owner.toLowerCase() !== currentOwner.toLowerCase()) {
					res.send(req.query.name.toLowerCase());

					return;
				}

				name.update({
					owner: req.query.q.toLowerCase(),
					updated: new Date()
				}).then(function() {
					res.send('Success');
				})

				tx.createTransaction(req.query.q.toLowerCase(), currentOwner.toLowerCase(), 0, name.name);
			});

			return;
		}

		if (typeof req.query.name_update !== 'undefined') {
			if (!req.query.name || !req.query.pkey) {
				res.status(400).send('Error6');

				return;
			}

			if (!/^[a-zA-Z0-9]+$/.test(req.query.name)) {
				res.status(400).send('Error6');

				return;
			}

			if (req.query.name.length > 64 || req.query.name.length < 1) {
				res.status(400).send('Error6');

				return;
			}

			if (!req.query.ar || !/^[a-z0-9\.\/\-\$]{1,256}$/i.test(req.query.ar)) {
				res.status(400).send('Error8');

				return;
			}

			var owner = krist.makeV2Address(req.query.pkey);

			names.getNameByName(req.query.name.toLowerCase()).then(function(name) {
				if (!name || name.owner.toLowerCase() !== owner.toLowerCase()) {
					res.send(req.query.name.toLowerCase());

					return;
				}

				name.update({
					a: req.query.ar,
					updated: new Date()
				}).then(function() {
					res.send('Success');
				})

				tx.createTransaction('a', owner.toLowerCase(), 0, name.name);
			});

			return;
		}

		next();
	});

	app.get('/name/check/:name', function(req, res) {
		if (!/^[a-zA-Z0-9]+$/.test(req.params.name)) {
			res.json({
				ok: false,
				error: 'name_not_alphanumeric'
			});

			return;
		}

		if (req.params.name.length > 64 || req.params.name.length < 1) {
			res.json({
				ok: false,
				error: 'name_invalid_length'
			});

			return;
		}

		names.getNameByName(req.params.name.toLowerCase()).then(function (name) {
			if (name) {
				res.json({
					ok: true,
					available: false
				});
			} else {
				res.json({
					ok: true,
					available: true
				});
			}
		});
	});

	app.get('/name/cost', function(req, res) {
		res.json({
			ok: true,
			name_cost: names.getNameCost().toString()
		});
	});

	app.get('/name/bonus', function(req, res) {
		names.getUnpaidNameCount().then(function(count) {
			res.json({
				ok: true,
				name_bonus: count.toString()
			});
		});
	});

	app.get('/names', function(req, res) {
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

		krist.getNames(req.query.limit, req.query.offset).then(function(names) {
			var out = [];

			names.forEach(function(name) {
				out.push({
					name: name.name,
					owner: name.owner,
					registered: moment(name.registered).format('YYYY-MM-DD HH:mm:ss').toString(),
					registered_unix: moment(name.registered).unix(),
					updated: moment(name.updated).format('YYYY-MM-DD HH:mm:ss').toString(),
					updated_unix: moment(name.updated).unix(),
					a: name.a
				});
			});

			res.json({
				ok: true,
				count: out.length,
				names: out
			});
		});
	});

	app.get('/names/new', function(req, res) {
		names.getUnpaidNames().then(function(results) {
			var out = [];

			results.forEach(function(name) {
				out.push({
					name: name.name,
					owner: name.owner,
					registered: moment(name.registered).format('YYYY-MM-DD HH:mm:ss').toString(),
					registered_unix: moment(name.registered).unix(),
					updated: moment(name.updated).format('YYYY-MM-DD HH:mm:ss').toString(),
					updated_unix: moment(name.updated).unix(),
					a: name.a
				});
			});

			res.json({
				ok: true,
				count: out.length,
				names: out
			});
		});
	});

	app.post('/name/:name', function(req, res) {
		if (!/^[a-zA-Z0-9]+$/.test(req.params.name)) {
			res.status(400).json({
				ok: false,
				error: 'name_not_alphanumeric'
			});

			return;
		}

		if (req.params.name.length > 64 || req.params.name.length < 1) {
			res.status(400).json({
				ok: false,
				error: 'name_invalid_length'
			});

			return;
		}

		if (!req.body.privatekey) {
			res.status(400).json({
				ok: false,
				error: 'missing_privatekey'
			});

			return;
		}

		var desiredName = req.params.name.toLowerCase();

		names.getNameByName(desiredName).then(function(name) {
			if (name) {
				res.status(409).json({
					ok: false,
					error: 'name_taken'
				});
			} else {
				addresses.getAddress(krist.makeV2Address(req.body.privatekey)).then(function(address) {
					if (!address || address.balance < names.getNameCost()) {
						res.status(403).json({
							ok: false,
							error: 'insufficient_funds'
						});

						return;
					}

					address.decrement({ balance: names.getNameCost() });
					address.increment({ totalout: names.getNameCost() });

					tx.createTransaction('name', address.address, names.getNameCost(), desiredName, null);
					names.createName(desiredName, address.address).then(function(newName) {
						res.json({
							ok: true,
							id: newName.id
						});
					});
				});
			}
		});
	});

	return app;
};