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

function Krist() {}

module.exports = Krist; // well whatever the problem was this fixed it

var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./webhooks.js'),
	websockets  = require('./websockets.js'),
	addresses   = require('./addresses.js'),
	moment      = require('moment'),
	fs          = require('fs'),
	errors      = require('./errors/errors.js');

var addressRegex = /^(?:k[a-z0-9]{9}|[a-f0-9]{10})$/i;
var addressListRegex = /^(?:k[a-z0-9]{9}|[a-f0-9]{10})(?:,(?:k[a-z0-9]{9}|[a-f0-9]{10}))*$/i;
var nameRegex = /^[a-z0-9]{1,64}$/i;
var aRecordRegex = /^[^\s/$.?#].[^\s]*$/i;

Krist.work = 18750; // work as of the writing of this line. this is used purely for backup.

Krist.init = function() {
	console.log('[Krist]'.bold + ' Loading...');

	var requiredConfigOptions = [
		'walletVersion',
		'nameCost',
		'workFactor',
		'maxWebsocketsPerHost'
	];

	requiredConfigOptions.forEach(function(option) {
		if (!config[option]) {
			console.error('[Config]'.red + ' Missing config option: ' + option);

			process.exit(1);
		}
	});

	// Check for and make the data dir

	/// WOW dont use deprecated functions lemmmmmym!
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

	fs.watchFile('motd.txt', function(curr, prev) {
		fs.readFile('motd.txt', function(err, data) {
			websockets.broadcastEvent({
				type: 'event',
				event: 'motd',
				new_motd: data.toString()
			}, function(ws) {
				return new Promise(function(resolve, reject) {
					if (ws.subscriptionLevel.indexOf("motd") >= 0) {
						return resolve();
					}

					reject();
				});
			});
		});
	});
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
	return typeof config.walletVersion === 'number' ? config.walletVersion : 13;
};

Krist.getMoneySupply = function() {
	return schemas.address.sum('balance');
};

Krist.getMinWork = function() {
	return config.minWork || 500;
};

Krist.getMaxWork = function() {
	return config.maxWork || 100000;
};

Krist.getWorkFactor = function() {
	return config.workFactor || 0.1;
};

Krist.getSecondsPerBlock = function() {
	return config.secondsPerBlock || 60;
};

Krist.makeV2Address = function(key) {
	var chars = ['', '', '', '', '', '', '', '', ''];
	var prefix = 'k';
	var hash = utils.sha256(utils.sha256(key));

	for (var i = 0; i <= 8; i++) {
		chars[i] = hash.substring(0, 2);
		hash = utils.sha256(utils.sha256(hash));
	}

	for (i = 0; i <= 8;) {
		var index = parseInt(hash.substring(2 * i, 2 + (2 * i)), 16) % 9;

		if (chars[index] === "") {
			hash = utils.sha256(hash);
		} else {
			prefix += utils.hexToBase36(parseInt(chars[index], 16));
			chars[index] = "";
			i++;
		}
	}

	return prefix;
};

Krist.isValidKristAddress = function(address) {
	return addressRegex.test(address);
};

Krist.isValidKristAddressList = function(addressList) {
	return addressListRegex.test(addressList);
};

Krist.isValidName = function(name) {
	return nameRegex.test(name) && name.length > 0 && name.length < 65;
};

Krist.isValidARecord = function(ar) {
	return aRecordRegex.test(ar);
};