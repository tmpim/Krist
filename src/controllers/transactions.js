var transactions    = require('./../transactions.js'),
	addresses       = require('./../addresses.js'),
	errors          = require('./../errors/errors.js');

function TransactionsController() {}

TransactionsController.getTransactions = function(limit, offset, asc) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
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

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
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

TransactionsController.transactionToJSON = function(transaction) {
	return {
		id: transaction.id,
		from: transaction.from,
		to: transaction.to,
		value: transaction.value,
		time: transaction.time,
		name: transaction.name,
		op: transaction.op
	};
};

module.exports = TransactionsController;