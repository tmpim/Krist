var krist               = require('./../krist.js'),
	utils               = require('./../utils.js'),
	addresses           = require('./../addresses.js'),
	tx                  = require('./../transactions.js'),
	names               = require('./../names.js'),
	errors              = require('./../errors/errors.js'),
	namesController     = require('./../controllers/names.js'),
	moment              = require('moment');

module.exports = function(app) {
	/**
	 * @apiDefine NameGroup Names
	 *
	 * All Name related endpoints.
	 */

	/**
	 * @apiDefine Name
	 *
	 * @apiSuccess {Object} name
	 * @apiSuccess {String} name.name The name.
	 * @apiSuccess {String} name.owner The address that currently owns this name.
	 * @apiSuccess {Date} name.registered The time this name was registered.
	 * @apiSuccess {Date} name.updated The time this name was last updated.
	 * @apiSuccess {String} name.a The A record (or CNAME record) of this name.
	 */

	/**
	 * @apiDefine Names
	 *
	 * @apiSuccess {Object[]} names
	 * @apiSuccess {String} names.name The name.
	 * @apiSuccess {String} names.owner The address that currently owns this name.
	 * @apiSuccess {Date} names.registered The time this name was registered.
	 * @apiSuccess {Date} names.updated The time this name was last updated.
	 * @apiSuccess {String} names.a The A record (or CNAME record) of this name.
	 */

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

		if (typeof req.query.nameCost !== 'undefined') {
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
					res.send('0');
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
					res.send('Error4');
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
				return res.send('Error6');
			}

			var desiredName = req.query.name.toLowerCase();

			names.getNameByName(desiredName).then(function(name) {
				if (name) {
					res.send('Error5');
				} else {
					addresses.getAddress(krist.makeV2Address(req.query.pkey)).then(function(address) {
						if (!address || address.balance < names.getNameCost()) {
							return res.send('Error1');
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
				return res.send('Error6');
			}

			if (!req.query.q || !krist.isValidKristAddress(req.query.q)) {
				return res.send('Error4');
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
				return res.send('Error6');
			}

			if (!req.query.ar || !krist.isValidARecord(req.query.ar)) {
				return res.send('Error8');
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

	app.get('/names/check/:name', function(req, res) {
		if (!krist.isValidName(req.params.name)) {
			return utils.sendErrorToRes(req, res, new errors.ErrorInvalidParameter('name'));
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

	app.get('/names/cost', function(req, res) {
		res.json({
			ok: true,
			nameCost: names.getNameCost().toString()
		});
	});

	app.get('/names/bonus', function(req, res) {
		names.getUnpaidNameCount().then(function(count) {
			res.json({
				ok: true,
				name_bonus: count.toString()
			});
		});
	});


	/**
	 * @api {get} /names List all names
	 * @apiName GetNames
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Names
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 50,
     *     "names": [
     *         {
     *             "name": "0",
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-10T20:56:37.000Z",
     *             "updated": "2015-05-24T22:54:21.000Z",
     *             "a": null
     *         },
     *         {
     *             "name": "00",
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-14T14:35:40.000Z",
     *             "updated": "2015-05-24T22:47:56.000Z",
     *             "a": null
     *         },
	 *  	   ...
	 */
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
			utils.sendErrorToRes(req, res, error);
		});
	});

	/**
	 * @api {get} /names/new List newest names
	 * @apiName GetNewNames
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription *Note*: This only returns names that are **unpaid**. An name is "paid off" after the submission
	 * 				   of 500 blocks after its registration.
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Names
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 50,
     *     "names": [
     *         {
     *             "name": "0",
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-10T20:56:37.000Z",
     *             "updated": "2015-05-24T22:54:21.000Z",
     *             "a": null
     *         },
     *         {
     *             "name": "00",
     *             "owner": "k9qyx784k7",
     *             "registered": "2015-05-14T14:35:40.000Z",
     *             "updated": "2015-05-24T22:47:56.000Z",
     *             "a": null
     *         },
	 *  	   ...
	 */
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
			utils.sendErrorToRes(req, res, error);
		});
	});

	/**
	 * @api {post} /names/:name Register a name
	 * @apiName RegisterName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} name The name you want to register.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true
	 * }
	 *
	 * @apiErrorExample {json} Name Taken
	 * {
	 *     "ok": false,
	 *     "error": "name_taken"
	 * }
	 *
	 * @apiErrorExample {json} Insufficient Funds
	 * {
	 *     "ok": false,
	 *     "error": "insufficient_funds"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Name
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "name"
	 * }
	 */
	app.post('/names/:name', function(req, res) {
		namesController.registerName(req.params.name, req.body.privatekey).then(function() {
			res.json({
				ok: true
			});
		}).catch(function(error) {
			utils.sendErrorToRes(req, res, error);
		});
	});


	/**
	 * @api {post} /names/:name/transfer Transfer a name
	 * @apiName TransferName
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Transfers the name to another owner.
	 *
	 * @apiParam (URLParameter) {String} name The name you want to transfer.
	 * @apiParam (BodyParameter) {String} address The address you want to transfer the name to.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "name": {
     *         "name": "example",
     *         "owner": "kre3w0i79j",
     *         "registered": "2016-02-06T14:01:19.000Z",
     *         "updated": "2016-02-06T14:08:36.000Z",
     *         "a": null,
     *     }
     * }
	 *
	 * @apiErrorExample {json} Name Not Found
	 * {
	 *     "ok": false,
	 *     "error": "name_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Not Name Owner
	 * {
	 *     "ok": false,
	 *     "error": "not_name_owner"
	 * }
	 */
	app.post('/names/:name/transfer', function(req, res) {
		namesController.transferName(req.params.name, req.body.privatekey, req.body.address).then(function(name) {
			res.json({
				ok: true,
				name: namesController.nameToJSON(name)
			});
		}).catch(function(error) {
			utils.sendErrorToRes(req, res, error);
		});
	});

	function updateName(req, res) {
		namesController.updateName(req.params.name, req.body.privatekey, req.body.a).then(function(name) {
			res.json({
				ok: true,
				name: namesController.nameToJSON(name)
			});
		}).catch(function(error) {
			utils.sendErrorToRes(req, res, error);
		});
	}

	/**
	 * @api {post} /names/:name/update Update the A record of a name (POST)
	 * @apiName UpdateNamePOST
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Updates the A record of a name.
	 *
	 * @apiParam (URLParameter) {String} name The name you want to update.
	 * @apiParam (BodyParameter) {String} a The A record you want to set for the name.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "name": {
     *         "name": "example",
     *         "owner": "kre3w0i79j",
     *         "registered": "2016-02-06T14:01:19.000Z",
     *         "updated": "2016-02-06T14:08:36.000Z",
     *         "a": "krist.ceriat.net",
     *     }
     * }
	 *
	 * @apiErrorExample {json} Name Not Found
	 * {
	 *     "ok": false,
	 *     "error": "name_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Not Name Owner
	 * {
	 *     "ok": false,
	 *     "error": "not_name_owner"
	 * }
	 */
	app.post('/names/:name/update', updateName);

	/**
	 * @api {put} /names/:name Update the A record of a name (PUT)
	 * @apiName UpdateNamePUT
	 * @apiGroup NameGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Updates the A record of a name.
	 *
	 * @apiParam (URLParameter) {String} name The name you want to update.
	 * @apiParam (BodyParameter) {String} a The A record you want to set for the name.
	 * @apiParam (BodyParameter) {String} privatekey The private key to your address.
	 *
	 * @apiUse Name
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "name": {
     *         "name": "example",
     *         "owner": "kre3w0i79j",
     *         "registered": "2016-02-06T14:01:19.000Z",
     *         "updated": "2016-02-06T14:08:36.000Z",
     *         "a": "krist.ceriat.net",
     *     }
     * }
	 *
	 * @apiErrorExample {json} Name Not Found
	 * {
	 *     "ok": false,
	 *     "error": "name_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Not Name Owner
	 * {
	 *     "ok": false,
	 *     "error": "not_name_owner"
	 * }
	 */
	app.put('/names/:name', updateName);

	return app;
};