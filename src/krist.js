var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./webhooks.js'),
	addresses   = require('./addresses.js'),
	moment      = require('moment'),
	fs          = require('fs'),
	errors      = require('./errors/errors.js');

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

Krist.getWorkGrowthFactor = function() {
	return config.work_growthFactor;
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
			v2+=utils.hexToBase36(parseInt(cocks[dean], 16));
			cocks[dean] = "";
			i++;
		}
	}

	return v2;
};

Krist.isKristAddress = function(address) {
	return /^(?:k[a-z0-9]{9}|[a-f0-9]{10})$/i.test(address);
};

module.exports = Krist;
