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

var transactions    = require('./../transactions.js'),
	addresses       = require('./../addresses.js'),
	krist           = require('./../krist.js'),
	names			= require('./../names.js'),
	errors          = require('./../errors/errors.js');

function TransactionsController() {}

TransactionsController.getTransactions = function (limit, offset, asc, includeMined) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset < 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		transactions.getTransactions(limit, offset, asc, includeMined).then(resolve).catch(reject);
	});
};

TransactionsController.getTransactionsByAddress = function(address, limit, offset, includeMined) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset < 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		addresses.getAddress(address).then(function(addr) {
			if (addr) {
				transactions.getTransactionsByAddress(addr.address, limit, offset, includeMined).then(resolve).catch(reject);
			} else {
				reject(new errors.ErrorAddressNotFound());
			}
		}).catch(reject);
	});
};

TransactionsController.getTransaction = function(id) {
	return new Promise(function(resolve, reject) {
		if (isNaN(id)) {
			return reject(new errors.ErrorInvalidParameter('id'));
		}

		id = Math.max(parseInt(id), 0);

		transactions.getTransaction(id).then(function(result) {
			if (!result) {
				return reject(new errors.ErrorTransactionNotFound());
			}

			resolve(result);
		}).catch(reject);
	});
};

TransactionsController.makeTransaction = function(privatekey, to, amount, com) {
	return new Promise(function(resolve, reject) {
		if (!privatekey) {
			return reject(new errors.ErrorMissingParameter('privatekey'));
		}

		if (!to) {
			return reject(new errors.ErrorMissingParameter('to'));
		}

		if (!amount) {
			return reject(new errors.ErrorMissingParameter('amount'));
		}

		var isName = /\.kst$/i.test(to);
		var toName = isName ? to.replace(/\.kst$/i, "") : "";

		if (isName) {
			if (!krist.isValidName(toName)) {
				return reject(new errors.ErrorInvalidParameter('to'));
			}
		} else {
			if (!krist.isValidKristAddress(to)) {
				return reject(new errors.ErrorInvalidParameter('to'));
			}
		}

		if (isNaN(amount) || amount < 1) {
			return reject(new errors.ErrorInvalidParameter('amount'));
		}

		if (com && (!/^[\x20-\x7F\n]+$/i.test(com) || com.length > 255)) {
			return reject(new errors.ErrorInvalidParameter('metadata'));
		}

		var from = krist.makeV2Address(privatekey);
		amount = parseInt(amount);

		addresses.verify(from, privatekey).then(function(results) {
			var authed = results.authed;
			var sender = results.address;

			if (!authed) {
				return reject(new errors.ErrorAuthFailed());
			}

			if (!sender || sender.balance < amount) {
				return reject(new errors.ErrorInsufficientFunds());
			}

			if (toName) {
				names.getNameByName(toName).then(function (name) {
					if (!name) {
						return reject(new errors.ErrorNameNotFound());
					}

					transactions.pushTransaction(sender, name.owner, amount, com).then(resolve).catch(reject);
				}).catch(reject);
			} else {
				transactions.pushTransaction(sender, to, amount, com).then(resolve).catch(reject);
			}
		});
	});
};

TransactionsController.transactionToJSON = function(transaction) {
	return transactions.transactionToJSON(transaction);
};

module.exports = TransactionsController;