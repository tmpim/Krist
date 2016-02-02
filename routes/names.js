var krist               = require('./../src/krist.js'),
	utils               = require('./../src/utils.js'),
	addresses           = require('./../src/addresses.js'),
	tx                  = require('./../src/transactions.js'),
	names               = require('./../src/names.js'),
	errors              = require('./../src/errors/errors.js'),
	namesController     = require('./../src/controllers/names.js'),
	moment              = require('moment');

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
			return res.send(names.getNameCost().toString());
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
			if (!krist.isValidName(req.query.name_check)) {
				return res.send("0");
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
			if (!req.query.name || !req.query.pkey || !krist.isValidName(req.query.name)) {
				return res.status(400).send('Error6');
			}

			var desiredName = req.query.name.toLowerCase();

			names.getNameByName(desiredName).then(function(name) {
				if (name) {
					res.status(409).send('Error5');
				} else {
					addresses.getAddress(krist.makeV2Address(req.query.pkey)).then(function(address) {
						if (!address || address.balance < names.getNameCost()) {
							return res.status(403).send('Error1');
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
			if (!req.query.name || !req.query.pkey || !krist.isValidName(req.query.name)) {
				return res.status(400).send('Error6');
			}

			if (!req.query.q || !krist.isValidKristAddress(req.query.q)) {
				return res.status(400).send('Error4');
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
				});

				tx.createTransaction(req.query.q.toLowerCase(), currentOwner.toLowerCase(), 0, name.name);
			});

			return;
		}

		if (typeof req.query.name_update !== 'undefined') {
			if (!req.query.name || !req.query.pkey || !krist.isValidName(req.query.name)) {
				return res.status(400).send('Error6');
			}

			if (!req.query.ar || !/^[a-z0-9\.\/\-\$]{1,256}$/i.test(req.query.ar)) {
				return res.status(400).send('Error8');
			}

			var owner = krist.makeV2Address(req.query.pkey);

			names.getNameByName(req.query.name.toLowerCase()).then(function(name) {
				if (!name || name.owner.toLowerCase() !== owner.toLowerCase()) {
					return res.send(req.query.name.toLowerCase());
				}

				name.update({
					a: req.query.ar,
					updated: new Date()
				}).then(function() {
					res.send('Success');
				});

				tx.createTransaction('a', owner.toLowerCase(), 0, name.name);
			});

			return;
		}

		next();
	});

	app.get('/name/check/:name', function(req, res) {
		if (!krist.isValidName(req.params.name)) {
			return utils.sendError(res, new errors.ErrorInvalidParameter('name'));
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
		namesController.getNames(req.query.limit, req.query.offset).then(function(results) {
			var out = [];

			results.forEach(function(name) {
				out.push(namesController.nameToJSON(name));
			});

			res.json({
				ok: true,
				count: out.length,
				names: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	app.get('/names/new', function(req, res) {
		namesController.getUnpaidNames(req.query.limit, req.query.offset).then(function(results) {
			var out = [];

			results.forEach(function(name) {
				out.push(namesController.nameToJSON(name));
			});

			res.json({
				ok: true,
				count: out.length,
				names: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	app.post('/name/:name', function(req, res) {
		namesController.registerName(req.params.name, req.body.privatekey).then(function() {
			res.json({
				ok: true
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	return app;
};