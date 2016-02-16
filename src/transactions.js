var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./webhooks.js'),
	addresses   = require('./addresses.js'),
	krist       = require('./krist.js');

function Transactions() {}

Transactions.getTransaction = function(id) {
	return schemas.transaction.findById(id);
};

Transactions.getTransactions = function(limit, offset, asc) {
	return schemas.transaction.findAll({order: 'id' + (asc ? '' : ' DESC'), limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Transactions.getRecentTransactions = function(limit, offset) {
	return schemas.transaction.findAll({order: 'id DESC', limit: utils.sanitiseLimit(limit, 100), offset: utils.sanitiseOffset(offset), where: {from: {$not: ''}}});
};

Transactions.getTransactionsByAddress = function(address, limit, offset) {
	return schemas.transaction.findAll({order: 'id DESC', where: {$or: [{from: address}, {to: address}]}, limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Transactions.createTransaction = function (to, from, value, name, op) {
	return new Promise(function(resolve, reject) {
		schemas.transaction.create({
			to: to,
			from: from,
			value: value,
			name: name,
			time: new Date(),
			op: op
		}).then(function(transaction) {
			webhooks.callTransactionWebhooks(transaction);

			resolve(transaction);
		}).catch(reject);
	});
};

Transactions.pushTransaction = function(sender, recipientAddress, amount, metadata) {
	return new Promise(function(resolve, reject) {
		addresses.getAddress(recipientAddress).then(function(recipient) {
			var promises = [];

			promises.push(sender.decrement({ balance: amount }));
			promises.push(sender.increment({ totalout: amount }));

			promises.push(Transactions.createTransaction(recipientAddress, sender.address, amount, null, metadata));

			if (!recipient) {
				promises.push(schemas.address.create({
					address: recipientAddress.toLowerCase(),
					firstseen: new Date(),
					balance: amount,
					totalin: amount,
					totalout: 0
				}));
			} else {
				promises.push(recipient.increment({ balance: amount, totalout: amount }));
			}

			Promise.all(promises).then(function(results) {
				resolve(results[2]);
			}).catch(reject);
		});
	});
};

Transactions.transactionToJSON = function(transaction) {
	return {
		id: transaction.id,
		from: transaction.from,
		to: transaction.to,
		value: transaction.value,
		time: transaction.time,
		name: transaction.name,
		metadata: transaction.op
	};
};

module.exports = Transactions;