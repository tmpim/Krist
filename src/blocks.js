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

function Blocks() {} // I had to nuke like, all the code to get the bloody websockets working.
// I'm having a mental breakdown here.
// I don't understand this code anymore.

module.exports = Blocks;

var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	krist       = require('./krist.js'),
	websockets	= require('./websockets.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./webhooks.js'),
	addresses   = require('./addresses.js'),
	names       = require('./names.js'),
	tx          = require('./transactions.js'),
	moment      = require('moment');

Blocks.getBlock = function(id) {
	return schemas.block.findById(id);
};

Blocks.getBlocks = function(limit, offset, asc) {
	return schemas.block.findAll({order: 'id' + (asc ? '' : ' DESC'),  limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getBlockCount = function() {
	return schemas.block.count();
};

Blocks.getBlocksByOrder = function(order, limit, offset) {
	return schemas.block.findAll({order: order, limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getLastBlock = function() {
	return schemas.block.findOne({order: 'id DESC'});
};

Blocks.getBaseBlockValue = function(blockID) {
	return blockID >= 100000 ? 12 : 25;
};

Blocks.getBlockValue = function() {
	return new Promise(function(resolve, reject) {
		Blocks.getLastBlock().then(function(lastBlock) {
			names.getUnpaidNameCount().then(function(count) {
				resolve(Blocks.getBaseBlockValue(lastBlock.id) + count);
			}).catch(reject);
		}).catch(reject);
	});
};

Blocks.submit = function(hash, address, nonce) {
	return new Promise(function(resolve, reject) {
		Blocks.getLastBlock().then(function(lastBlock) {
			names.getUnpaidNameCount().then(function(count) {
				var value = Blocks.getBaseBlockValue(lastBlock.id) + count;

				var time = new Date();

				var oldWork = krist.getWork();

				var seconds = (time - lastBlock.time) / 1000;
				var targetWork = seconds * oldWork / krist.getSecondsPerBlock();
				var diff = targetWork - oldWork;

				var newWork = Math.round(Math.max(Math.min(oldWork + diff * krist.getWorkFactor(), krist.getMaxWork()), krist.getMinWork()));

				console.log('[Krist]'.bold + ' Block submitted by ' + address.toString().bold + ' at ' + moment().format('HH:mm:ss DD/MM/YYYY').toString().cyan + '.');

				krist.setWork(newWork);

				schemas.block.create({
					hash: hash,
					address: address,
					nonce: nonce,
					time: time,
					difficulty: oldWork,
					value: value
				}).then(function(block) {
					webhooks.callBlockWebhooks(block, newWork);

					websockets.broadcast({
						type: 'event',
						event: 'block',
						block: Blocks.blockToJSON(block),
						new_work: newWork
					});

					console.log('        New work: ' + newWork.toLocaleString().green);

					addresses.getAddress(address.toLowerCase()).then(function(kristAddress) {
						if (!kristAddress) {
							schemas.address.create({
								address: address.toLowerCase(),
								firstseen: time,
								balance: value,
								totalin: value,
								totalout: 0
							}).then(function(addr) {
								console.log('        ' + addr.address.bold + '\'s balance: ' + addr.balance.toLocaleString().green + ' KST');
								resolve({work: newWork, address: addr, block: block});
							});

							return;
						}

						kristAddress.increment({ balance: value, totalin: value }).then(function() {
							kristAddress.reload().then(function(updatedAddress) {
								console.log('        ' + updatedAddress.address.bold + '\'s balance: ' + updatedAddress.balance.toLocaleString().green + ' KST');
								resolve({work: newWork, address: updatedAddress, block: block});
							});
						});
					});

					tx.createTransaction(address, null, value, null, null);

					schemas.name.findAll({ where: { unpaid: { $gt: 0 }}}).then(function(names) {
						names.forEach(function(name) {
							name.decrement({ unpaid: 1 });
						});
					});
				}).catch(reject);
			});
		});
	});
};

Blocks.blockToJSON = function(block) {
	return {
		height: block.id,
		address: block.address,
		hash: block.hash,
		short_hash: block.hash.substring(0, 12),
		value: block.value,
		time: block.time,
		difficulty: block.difficulty
	};
};