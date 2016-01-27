var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./../src/webhooks.js'),
	moment      = require('moment'),
	fs          = require('fs');

function Krist() {}

Krist.work = 18750; // work as of the writing of this line. this is used purely for backup.

Krist.init = function() {
	console.log('[Krist]'.bold + ' Loading...');

	var requiredConfigOptions = [
		'wallet_version',
		'name_cost',
		'work_growthFactor',
		'webhooks_maxPerHost'
	];

	requiredConfigOptions.forEach(function(option) {
		if (!config[option]) {
			console.error('[Config]'.red + ' Missing config option: ' + option);

			process.exit(1);
		}
	});

	// Check for and make the data dir
	if (!fs.existsSync('data')) {
		fs.mkdirSync('data', 775);
	}

	// Check for and make the work file
	if (fs.existsSync('data/work')) {
		fs.access('data/work', fs.W_OK, function(err) {
			if (err) {
				console.log('[Krist]'.red + ' Cannot access data/work file. Please check the running user/group has write perms.');
				console.log('[Krist]'.red + ' ' + err);
				console.log('[Krist]'.red + ' Aborting.');

				process.exit(1);
			}
		});

		fs.readFile('data/work', function(err, contents) {
			if (err) {
				console.log('[Krist]'.red + ' Critical error reading work file.');
				console.log('[Krist]'.red + ' ' + err);

				return;
			}

			Krist.work = parseInt(contents);

			console.log('[Krist]'.bold + ' Current work: ' + Krist.work.toString().green);
		});
	} else {
		fs.writeFile('data/work', Krist.work, function(err) {
			if (err) {
				console.log('[Krist]'.red + ' Critical error writing work file.');
				console.log('[Krist]'.red + ' ' + err);
			}
		});
	}
};

Krist.getWork = function() {
	return Krist.work;
};

Krist.setWork = function(work) {
	Krist.work = work;

	fs.writeFile('data/work', work, function(err) {
		if (err) {
			console.log('[Krist]'.red + ' Critical error writing work file.');
			console.log('[Krist]'.red + ' ' + err);
		}
	});
};

Krist.getWalletVersion = function() {
	return typeof config.wallet_version === 'number' ? config.wallet_version : 13;
};

Krist.getBlock = function(id) {
	return schemas.block.findById(id);
};

Krist.getBlocks = function(limit, offset, asc) {
	return schemas.block.findAll({order: 'id' + (asc ? '' : ' DESC'), limit: typeof limit !== 'undefined' ? Math.min(parseInt(limit) === 0 ? 50 : parseInt(limit), 1000) : 50, offset: typeof offset !== 'undefined' ? parseInt(offset) : null});
};

Krist.getBlocksByOrder = function(order, limit) {
	return schemas.block.findAll({order: order, limit: typeof limit !== 'undefined' ? Math.min(parseInt(limit) === 0 ? 50 : parseInt(limit), 1000) : 50});
};

Krist.getLastBlock = function() {
	return schemas.block.findOne({order: 'id DESC'});
};

Krist.getMoneySupply = function() {
	return schemas.address.sum('balance');
};

Krist.getAddress = function(address) {
	return schemas.address.findOne({where: {address: address}});
};

Krist.getAddresses = function(limit, offset) {
	return schemas.address.findAll({limit: typeof limit !== 'undefined' ? parseInt(limit) : null, offset: typeof offset !== 'undefined' ? parseInt(offset) : null});
};

Krist.getRich = function() {
	return schemas.address.findAll({limit: 50, order: 'balance DESC'});
};

Krist.getNames = function(limit, offset) {
	return schemas.name.findAll({order: 'name', limit: typeof limit !== 'undefined' ? parseInt(limit) : null, offset: typeof offset !== 'undefined' ? parseInt(offset) : null});
};

Krist.getNamesByOwner = function(owner) {
	return schemas.name.findAll({order: 'name', where: {owner: owner}});
};

Krist.getNameCountByOwner = function(owner) {
	return schemas.name.count({where: {owner: owner}});
};

Krist.getNameByName = function(name) {
	return schemas.name.findOne({where: {name: name}});
};

Krist.getUnpaidNames = function() {
	return schemas.name.findAll({order: 'id DESC', where: {unpaid: {$gt: 0}}});
};

Krist.getUnpaidNameCount = function() {
	return schemas.name.count({where: {unpaid: {$gt: 0}}});
};

Krist.getTransaction = function(id) {
	return schemas.transaction.findById(id);
};

Krist.getTransactions = function(limit, offset, asc) {
	return schemas.transaction.findAll({order: 'id' + (asc ? '' : ' DESC'), limit: typeof limit !== 'undefined' ? Math.min(parseInt(limit) === 0 ? 50 : parseInt(limit), 1000) : 50, offset: typeof offset !== 'undefined' ? parseInt(offset) : null});
};

Krist.getRecentTransactions = function() {
	return schemas.transaction.findAll({order: 'id DESC', limit: 100, where: {from: {$not: ''}}});
};

Krist.getTransactionsByAddress = function(address, limit, offset) {
	return schemas.transaction.findAll({order: 'id DESC', where: {$or: [{from: address}, {to: address}]}, limit: typeof limit !== 'undefined' ? Math.min(parseInt(limit) === 0 ? 50 : parseInt(limit), 1000) : 50, offset: offset !== 'undefined' ? parseInt(offset) : null});
};

Krist.getBaseBlockValue = function(blockid) {
	var subsidy = 25;

	if (blockid >= 100000) {
		subsidy = 12;
	}

	return subsidy;
};

Krist.getBlockValue = function() {
	return new Promise(function(resolve, reject) {
		Krist.getLastBlock().then(function(lastBlock) {
			Krist.getUnpaidNameCount().then(function(count) {
				resolve(Krist.getBaseBlockValue(lastBlock.id) + count);
			}).catch(reject);
		}).catch(reject);
	});
};

Krist.getNameCost = function() {
	return config.name_cost;
};

Krist.getWorkGrowthFactor = function() {
	return config.work_growthFactor;
};

Krist.createTransaction = function(to, from, value, name) {
	return schemas.transaction.create({
		to: to,
		from: from,
		value: value,
		name: name,
		time: new Date()
	}).then(function(transaction) {
		webhooks.callTransactionWebhooks(transaction);
	});
};

Krist.createName = function(name, owner) {
	return schemas.name.create({
		name: name,
		owner: owner,
		registered: new Date(),
		updated: new Date(),
		unpaid: Krist.getNameCost()
	}).then(function(name) {
		webhooks.callNameWebhooks(name);
	});
};

Krist.submit = function(hash, address, nonce) {
	return new Promise(function(resolve, reject) {
		Krist.getBlockValue().then(function(value) {
			var time = new Date();

			var oldWork = Krist.getWork();
			var newWork = Math.round(Krist.getWork() * Krist.getWorkGrowthFactor());

			console.log('[Krist]'.bold + ' Block submitted by ' + address.toString().bold + ' at ' + moment().format('HH:mm:ss DD/MM/YYYY').toString().cyan + '.');
			console.log('        Current work: ' + newWork.toString().green);

			Krist.setWork(newWork);

			schemas.block.create({
				hash: hash,
				address: address,
				nonce: nonce,
				time: time,
				difficulty: oldWork,
				value: value
			}).then(function(block) {
				webhooks.callBlockWebhooks(block);
			});

			Krist.getAddress(address.toLowerCase()).then(function(kristAddress) {
				if (!kristAddress) {
					schemas.address.create({
						address: address.toLowerCase(),
						firstseen: time,
						balance: value,
						totalin: value,
						totalout: 0
					}).then(function(addr) {
						resolve(newWork, addr);
					});

					return;
				}

				kristAddress.increment({ balance: value, totalin: value }).then(function(addr) {
					addr.balance += value; // sequelize is super stupid

					resolve({work: newWork, address: addr});
				});
			});

			Krist.createTransaction(address, null, value, null);

			schemas.name.findAll({ where: { unpaid: { $gt: 0 }}}).then(function(names) {
				names.forEach(function(name) {
					name.decrement({ unpaid: 1 });
				});
			});
		});
	});
};

Krist.makeV2Address = function(key) {
	var cocks = ['', '', '', '', '', '', '', '', ''];
	var v2 = 'k';
	var circles = utils.sha256(utils.sha256(key));

	for (var i = 0; i <= 8; i++) {
		cocks[i] = circles.substring(0, 2);
		circles = utils.sha256(utils.sha256(circles));
	}

	for (i = 0; i <= 8;) {
		var dean = parseInt(circles.substring(2 * i, 2 + (2 * i)), 16) % 9;

		if (cocks[dean] === "") {
			circles = utils.sha256(circles);
		} else {
			v2+=utils.hexToBase64(parseInt(cocks[dean], 16));
			cocks[dean] = "";
			i++;
		}
	}

	return v2;
};

module.exports = Krist;
