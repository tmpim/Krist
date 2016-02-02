var transactions    = require('./../transactions.js'),
	errors          = require('./../errors/errors.js'),
	utils           = require('./../utils.js');

function TransactionsController() {}

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