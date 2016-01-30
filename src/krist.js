var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./webhooks.js'),
	addresses   = require('./addresses.js'),
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

Krist.getMoneySupply = function() {
	return schemas.address.sum('balance');
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

Krist.getWorkGrowthFactor = function() {
	return config.work_growthFactor;
};

Krist.createTransaction = function (to, from, value, name, op) {
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

Krist.pushTransaction = function(sender, recipientAddr, amount, metadata) {
	return new Promise(function(resolve, reject) {
		addresses.getAddress(recipientAddr).then(function(recipient) {
			var promises = [];

			promises.push(sender.decrement({ balance: amount }));
			promises.push(sender.increment({ totalout: amount }));

			promises.push(Krist.createTransaction(recipient.address, sender.address, amount, null, metadata));

			if (!recipient) {
				promises.push(schemas.address.create({
					address: recipient.toLowerCase(),
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
