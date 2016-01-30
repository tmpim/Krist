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
	return schemas.transaction.findAll({order: 'id' + (asc ? '' : ' DESC'), limit: typeof limit !== 'undefined' ? Math.min(parseInt(limit) === 0 ? 50 : parseInt(limit), 1000) : 50, offset: typeof offset !== 'undefined' ? parseInt(offset) : null});
};

Transactions.getRecentTransactions = function() {
	return schemas.transaction.findAll({order: 'id DESC', limit: 100, where: {from: {$not: ''}}});
};

Transactions.getTransactionsByAddress = function(address, limit, offset) {
	return schemas.transaction.findAll({order: 'id DESC', where: {$or: [{from: address}, {to: address}]}, limit: typeof limit !== 'undefined' ? Math.min(parseInt(limit) === 0 ? 50 : parseInt(limit), 1000) : 50, offset: offset !== 'undefined' ? parseInt(offset) : null});
};

Transactions.createTransaction = function (to, from, value, name, op) {
	return schemas.transaction.create({
		to: to,
		from: from,
		value: value,
		name: name,
		time: new Date(),
		op: op
	}).then(function(transaction) {
		webhooks.callTransactionWebhooks(transaction);
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

			Promise.all(promises).then(resolve).catch(reject);
		});
	});
};

module.exports = Transactions;