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

var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./webhooks.js'),
	websockets	= require('./websockets.js'),
	addresses   = require('./addresses.js'),
	krist       = require('./krist.js');

function Transactions() {}

Transactions.getTransaction = function(id) {
	return schemas.transaction.findById(id);
};

Transactions.getTransactions = function (limit, offset, asc, includeMined) {
	var query = {
		order: 'id' + (asc ? '' : ' DESC'),
		limit: utils.sanitiseLimit(limit),
		offset: utils.sanitiseOffset(offset),
		where: {}
	};

	if (!includeMined) {
		query.where.from = {
			$notIn: ['', ' '],
			$ne: null
		};
	}

	return schemas.transaction.findAndCountAll(query);
};

Transactions.getRecentTransactions = function(limit, offset) {
	return schemas.transaction.findAll({order: 'id DESC', limit: utils.sanitiseLimit(limit, 100), offset: utils.sanitiseOffset(offset), where: {from: {$not: ''}}});
};

Transactions.getTransactionsByAddress = function(address, limit, offset, includeMined) {
	var query = {
		order: 'id DESC',
		limit: utils.sanitiseLimit(limit),
		offset: utils.sanitiseOffset(offset),
		where: {$or: [{from: address}]}
	};

	if (!includeMined) { // To tell you the truth, idk either.
		query.where.$or.push({
			from: {
				$notIn: ['', ' '],
				$ne: null
			},
			to: address
		});
	} else {
		query.where.$or.push({
			to: address
		});
	}

	return schemas.transaction.findAndCountAll(query);
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

Transactions.pushTransaction = function(sender, recipientAddress, amount, metadata, name) {
	return new Promise(function(resolve, reject) {
		addresses.getAddress(recipientAddress).then(function(recipient) {
			var promises = [];

			promises.push(sender.decrement({ balance: amount }));
			promises.push(sender.increment({ totalout: amount }));

			promises.push(Transactions.createTransaction(recipientAddress, sender.address, amount, name, metadata));

			if (!recipient) {
				promises.push(schemas.address.create({
					address: recipientAddress.toLowerCase(),
					firstseen: new Date(),
					balance: amount,
					totalin: amount,
					totalout: 0
				}));
			} else {
				promises.push(recipient.increment({ balance: amount, totalin: amount }));
			}

			Promise.all(promises).then(function(results) {
				websockets.broadcastEvent({
					type: 'event',
					event: 'transaction',
					transaction: Transactions.transactionToJSON(results[2])
				}, function(ws) {
					return new Promise(function(resolve, reject) {
						if ((!ws.isGuest && (ws.auth === recipientAddress || ws.auth === sender.address) && ws.subscriptionLevel.indexOf("ownTransactions") >= 0) || ws.subscriptionLevel.indexOf("transactions") >= 0) {
							return resolve();
						}

						reject();
					});
				});

				resolve(results[2]);
			}).catch(reject);
		}).catch(reject);
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