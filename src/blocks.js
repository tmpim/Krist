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
	return schemas.block.findAndCountAll({order: 'id' + (asc ? '' : ' DESC'),  limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getBlocksByOrder = function(order, limit, offset) {
	return schemas.block.findAndCountAll({order: order, limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getLastBlock = function() {
	return schemas.block.findOne({order: 'id DESC'});
};

Blocks.getBaseBlockValue = function(blockID) {
	if (blockID >= 1 && blockID < 501) return 400000000000;
	if (blockID >= 501 && blockID < 541) return 381274937337;
	if (blockID >= 541 && blockID < 546) return 350000000000;
	if (blockID >= 546 && blockID < 549) return 400000000000;
	if (blockID >= 549 && blockID < 554) return 300000000000;
	if (blockID >= 554 && blockID < 635) return 288365888229;
	if (blockID >= 635 && blockID < 891) return 58365888229;
	if (blockID >= 891 && blockID < 936) return 6000000000;
	if (blockID >= 936 && blockID < 974) return 400000000000;
	if (blockID >= 974 && blockID < 979) return 100000000000;
	if (blockID >= 979 && blockID < 1083) return 400000000000;
	if (blockID >= 1083 && blockID < 1149) return 100000000000;
	if (blockID >= 1149 && blockID < 1165) return 10000000000;
	if (blockID >= 1165 && blockID < 1171) return 5000000000;
	if (blockID >= 1171 && blockID < 1172) return 500000000;
	if (blockID >= 1172 && blockID < 1178) return 5000000000;
	if (blockID >= 1178 && blockID < 1355) return 2000000000000;
	if (blockID >= 1355 && blockID < 1390) return 200000000000;
	if (blockID >= 1390 && blockID < 2486) return 20000000000;
	if (blockID >= 2486 && blockID < 2640) return 400000000000;
	if (blockID >= 2640 && blockID < 2667) return 300000000000;
	if (blockID >= 2667 && blockID < 2700) return 3000000000;
	if (blockID >= 2700 && blockID < 2743) return 10000000000;
	if (blockID >= 2743 && blockID < 2773) return 8000000000;
	if (blockID >= 2773 && blockID < 2795) return 5000000000;
	if (blockID >= 2795 && blockID < 2812) return 3000000000;
	if (blockID >= 2812 && blockID < 2813) return 1000000000;
	if (blockID >= 2813 && blockID < 2936) return 400000000000;
	if (blockID >= 2936 && blockID < 2942) return 4000000000;
	if (blockID >= 2942 && blockID < 2972) return 8000000000;
	if (blockID >= 2972 && blockID < 2989) return 2000000000;
	if (blockID >= 2989 && blockID < 2990) return 100000000;
	if (blockID >= 2990 && blockID < 2998) return 500000000;
	if (blockID >= 2998 && blockID < 3000) return 200000000;
	if (blockID >= 3000 && blockID < 3003) return 100000000;
	if (blockID >= 3003 && blockID < 3005) return 50000000;
	if (blockID >= 3005 && blockID < 3006) return 23555120;
	if (blockID >= 3006 && blockID < 3018) return 53555120;
	if (blockID >= 3018 && blockID < 3029) return 20000000;
	if (blockID >= 3029 && blockID < 3089) return 400000000000;
	if (blockID >= 3089 && blockID < 3096) return 20000000;
	if (blockID >= 3096 && blockID < 3368) return 19875024;
	if (blockID >= 3368 && blockID < 4097) return 10875024;
	if (blockID >= 4097 && blockID < 5000) return 8750240;

	return blockID >= 222222 ? 1 : (blockID >= 100000 ? 12 : 25);
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

					websockets.broadcastEvent({
						type: 'event',
						event: 'block',
						block: Blocks.blockToJSON(block),
						new_work: newWork
					}, function(ws) {
						return new Promise(function(resolve, reject) {
							if ((!ws.isGuest && ws.auth === address && ws.subscriptionLevel.indexOf("ownBlocks") >= 0) || ws.subscriptionLevel.indexOf("blocks") >= 0) {
								return resolve();
							}

							reject();
						});
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
    short_hash: block.hash ? block.hash.substring(0, 12) : null,
		value: block.value,
		time: block.time,
		difficulty: block.id < 5000 ? Blocks.getBaseBlockValue(block.id) : block.difficulty
	};
};
