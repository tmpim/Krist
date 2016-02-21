/**
 * Created by Drew Lemmy, 2016
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

var krist               = require('./../krist.js'),
	addresses           = require('./../addresses.js'),
	addressesController = require('./../controllers/addresses.js'),
	namesController     = require('./../controllers/names.js'),
	txController        = require('./../controllers/transactions.js'),
	names               = require('./../names.js'),
	tx                  = require('./../transactions.js'),
	utils               = require('./../utils.js'),
	moment              = require('moment');

module.exports = function(app) {
	/**
	 * @apiDefine AddressGroup Addresses
	 *
	 * All Address related endpoints.
	 */

	/**
	 * @apiDefine Address
	 *
	 * @apiSuccess {Object} address
	 * @apiSuccess {String} address.address The address.
	 * @apiSuccess {Number} address.balance The amount of Krist currently owned by this address.
	 * @apiSuccess {Number} address.totalin The total amount of Krist that has ever gone into this address.
	 * @apiSuccess {Number} address.totalout The total amount of Krist that has ever gone out of this address.
	 * @apiSuccess {Date} address.firstseen The date this address was first seen (when the first transaction to it was made).
	 */

	/**
	 * @apiDefine Addresses
	 *
	 * @apiSuccess {Object[]} addresses
	 * @apiSuccess {String} addresses.address The address.
	 * @apiSuccess {Number} addresses.balance The amount of Krist currently owned by this address.
	 * @apiSuccess {Number} addresses.totalin The total amount of Krist that has ever gone into this address.
	 * @apiSuccess {Number} addresses.totalout The total amount of Krist that has ever gone out of this address.
	 * @apiSuccess {Date} addresses.firstseen The date this address was first seen (when the first transaction to it was made).
	 */

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

	/**
	 * @api {get} /addresses List all addresses
	 * @apiName GetAddresses
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiSuccess {Number} total The total count of addresses.
	 * @apiUse Addresses
	 *
	 * @apiSuccessExample {json} Success
	 *      {
	 *  	    "ok": true,
	 *  	    "count": 50,
	 *  	    "total": 500,
	 *  	    "addresses": [
	 *  	        {
	 *  	            "address": "0000000000",
	 *  	            "balance": 0,
	 *  	            "totalin": 50,
	 *  	            "totalout": 50,
	 *  	            "firstseen": "2015-02-14T16:44:40.000Z"
	 *  	        },
	 *  	        {
	 *  	            "address": "a5dfb396d3",
	 *  	            "balance": 30000,
	 *  	            "totalin": 100000,
	 *  	            "totalout": 130000,
	 *  	            "firstseen": "2015-02-14T20:42:30.000Z"
	 *  	        },
	 *  	        ...
	 */
	app.get('/addresses', function(req, res) {
		addressesController.getAddresses(req.query.limit, req.query.offset).then(function(results) {
			var resultat = results[0];
			var count = results[1];

			var out = [];

			resultat.forEach(function(address) {
				out.push(addressesController.addressToJSON(address));
			});

			res.json({
				ok: true,
				count: out.length,
				total: count,
				addresses: out
			});
		}).catch(function(error) {
			utils.sendErrorToRes(req, res, error);
		});
	});

	/**
	 * @api {get} /addresses/rich List the richest addresses
	 * @apiName GetRichAddresses
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Addresses
	 *
     * @apiSuccessExample {json} Success
	 *      {
	 *          "ok": true,
	 *          "count": 50,
	 *          "addresses": [
	 *              {
	 *                  "address": "k2sdlnjo1m",
	 *                  "balance": 762010,
	 *                  "totalin": 11316,
	 *                  "totalout": 783984,
	 *                  "firstseen": "2016-01-24T05:08:14.000Z"
	 *              },
	 *              {
	 *                  "address": "k7u9sa6vbf",
	 *                  "balance": 505832,
	 *                  "totalin": 547785,
	 *                  "totalout": 41953,
	 *                  "firstseen": "2015-03-05T04:50:40.000Z"
	 *              },
	 *              ...
	 */
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
			utils.sendErrorToRes(req, res, error);
		});
	});

	/**
	 * @api {get} /addresses/:address Get an address
	 * @apiName GetAddress
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} address The address.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Address
	 *
	 * @apiSuccessExample {json} Success
	 * {
	 *     "ok": true,
	 *     "address": {
	 *         "address": "kre3w0i79j",
	 *         "balance": 86945,
	 *         "totalin": 123364,
	 *         "totalout": 38292,
	 *         "firstseen": "2015-03-13T12:55:18.000Z"
	 *     }
	 * }
	 *
	 * @apiErrorExample {json} Address Not Found
	 * {
	 *     "ok": false,
	 *     "error": "address_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Address
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "address"
	 * }
	 */
	app.get('/addresses/:address', function(req, res) {
		addressesController.getAddress(req.params.address).then(function(address) {
			res.json({
				ok: true,
				address: addressesController.addressToJSON(address)
			});
		}).catch(function(error) {
			utils.sendErrorToRes(req, res, error);
		});
	});


	/**
	 * @api {get} /addresses/:address/names Get all names registered to an address
	 * @apiName GetAddressNames
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} address The address.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Names
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 8,
     *     "names": [
     *         {
     *             "name": "supercoolname",
     *             "owner": "kre3w0i79j",
     *             "registered": "2016-01-30T15:45:55.000Z",
     *             "updated": "2016-01-30T15:45:55.000Z",
     *             "a": null
     *         },
	 *
	 * @apiErrorExample {json} Address Not Found
	 * {
	 *     "ok": false,
	 *     "error": "address_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Address
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "address"
	 * }
	 */
	app.get('/addresses/:address/names', function(req, res) {
		namesController.getNamesByAddress(req.params.address, req.query.limit, req.query.offset).then(function(names) {
			var out = [];

			names.forEach(function (name) {
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
	 * @api {get} /addresses/:address/transactions Get the recent transactions from an address
	 * @apiName GetAddressTransactions
	 * @apiGroup AddressGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (URLParameter) {String} address The address.
	 *
	 * @apiParam (QueryParameter) {Number} [limit=50] The maximum amount of results to return.
	 * @apiParam (QueryParameter) {Number} [offset=0] The amount to offset the results.
	 *
	 * @apiSuccess {Number} count The count of results.
	 * @apiUse Transactions
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "count": 50,
     *     "transactions": [
     *         {
     *             "id": 153197,
     *             "from": "kxxhsp1uzh",
     *             "to": "kre3w0i79j",
     *             "value": 75,
     *             "time": "2016-02-02T23:30:51.000Z",
     *             "name": null,
     *             "op": null
     *         },
     *         {
     *             "id": 153196,
     *             "from": "kre3w0i79j",
     *             "to": "kxxhsp1uzh",
     *             "value": 50,
     *             "time": "2016-02-02T23:30:39.000Z",
     *             "name": null,
     *             "op": null
     *         },
	 *
	 * @apiErrorExample {json} Address Not Found
	 * {
	 *     "ok": false,
	 *     "error": "address_not_found"
	 * }
	 *
	 * @apiErrorExample {json} Invalid Address
	 * {
	 *     "ok": false,
	 *     "error": "invalid_parameter",
	 *     "parameter": "address"
	 * }
	 */
	app.get('/addresses/:address/transactions', function(req, res) {
		txController.getTransactionsByAddress(req.params.address, req.query.limit, req.query.offset).then(function(transactions) {
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
			utils.sendErrorToRes(req, res, error);
		});
	});


	return app;
};