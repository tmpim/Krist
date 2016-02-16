var transactions    = require('./../transactions.js'),
	addresses       = require('./../addresses.js'),
	krist           = require('./../krist.js'),
	names			= require('./../names.js'),
	errors          = require('./../errors/errors.js');

function TransactionsController() {}

TransactionsController.getTransactions = function(limit, offset, asc) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset < 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		transactions.getTransactions(limit, offset, asc).then(resolve).catch(reject);
	});
};

TransactionsController.getTransactionsByAddress = function(address, limit, offset) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset < 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		addresses.getAddress(address).then(function(addr) {
			if (addr) {
				transactions.getTransactionsByAddress(addr.address, limit, offset).then(resolve).catch(reject);
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

		if (com && !/^[\x20-\x7F]+$/i.test(com)) {
			return reject(new errors.ErrorInvalidParameter('com'));
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