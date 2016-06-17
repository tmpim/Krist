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

var config		= require('./config.js'),
	package     = require('./package.json');

require('colors'); // colours
require('console-stamp')(console, {
	pattern: 'HH:MM:ss',
	label: false,
	colors: {
		stamp: "yellow"
	}
});

var	errors      = require('./src/errors/errors.js'),
	redis		= require('./src/redis.js'),
	database	= require('./src/database.js'),
	webserver	= require('./src/webserver.js');

console.log('Starting ' + package.name.bold + ' ' + package.version.blue + '...');

process.on('uncaughtException', function(error) {
	console.log('Uncaught exception'.red.bold);
	console.log(error.stack);
});

redis.init().then(function() {
	database.init().then(function() {
		require('./src/krist.js').init();

		if (config.debugMode) {
			require('./src/websockets.js');

			// Debug commands only in use on the test node. Go away.

			var stdin = process.openStdin();
			var krist = require('./src/krist.js');

			stdin.addListener('data', function (d) {
				var args = d.toString().trim().split(" ");

				if (args[0] === "setWork") {
					return krist.setWork(new Number(args[1]));
				}

				if (args[0] === "getWork") {
					console.log('[Krist]'.bold + ' Current work: ' + krist.getWork().toString().green);
				}
			});
		}

		webserver.init(); // Yeah something happened here idk
	});
});