var krist = require('./../src/krist.js'),
	moment  = require('moment');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.dumpnames !== 'undefined') {
			krist.getNames().then(function(names) {
				var out = '';

				names.forEach(function(name) {
					out += name.name + ';';
				});

				res.send(out);
			});

			return;
		}

		if (typeof req.query.name_cost !== 'undefined') {
			res.send(krist.getNameCost().toString());

			return;
		}

		if (req.query.getnames) {
			krist.getAddress(req.query.getnames).then(function(address) {
				if (address) {
					krist.getNameCountByOwner(address.address).then(function(names) {
						res.send(names.toString());
					});
				} else {
					res.status(404).send('0');
				}
			});

			return;
		}

		if (req.query.listnames) {
			krist.getAddress(req.query.listnames).then(function(address) {
				if (address) {
					krist.getNamesByOwner(address.address).then(function(names) {
						var out = '';

						names.forEach(function(name) {
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
			krist.getUnpaidNames().then(function(names) {
				var out = '';

				names.forEach(function(name) {
					out += name.name + ';';
				});

				res.send(out);
			});

			return;
		}

		if (req.query.name_check) {
			if (/[^a-zA-Z0-9]/.test(req.query.name_check)) {
				res.send("0");

				return;
			}

			if (req.query.name_check.length > 64 || req.query.name_check.length < 1) {
				res.send("0");

				return;
			}

			krist.getNameByName(req.query.name_check).then(function (name) {
				if (name) {
					res.send("0");
				} else {
					res.send("01"); // look at Taras's code and you'll know why :^)
				}
			});

			return;
		}

		next();
	});

	app.get('/name/check/:name', function(req, res) {
		if (/[^a-zA-Z0-9]/.test(req.params.name)) {
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

		krist.getNameByName(req.params.name).then(function (name) {
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
		krist.getUnpaidNames().then(function(names) {
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

	return app;
};