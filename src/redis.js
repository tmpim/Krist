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

var	config	    = require('./../config.js'),
	bluebird	= require('bluebird'),
	redis		= require('redis');

function Redis() {}

module.exports = Redis;

Redis.getClient = function() {
	return Redis.client;
};

Redis.init = function() {
	return new Promise(function(resolve) {
		console.log('[Redis]'.cyan + ' Connecting...');

		Redis.client = redis.createClient({
			host: config.redisHost || '127.0.0.1',
			port: config.redisPort || 6379,
			prefix: config.redisPrefix
		});

		Redis.client.on('connect', function() {
			console.log('[Redis]'.green + ' Connected');
			resolve();
		});

		Redis.client.on('reconnecting', function() {
			console.log('[Redis]'.yellow + ' Connection lost. Reconnecting...');
		});

		Redis.client.on('error', function(err) {
			console.log('[Redis]'.red + ' Error: ');
			console.log(err);
		});

		bluebird.promisifyAll(redis.RedisClient.prototype);
		bluebird.promisifyAll(redis.Multi.prototype);
	});
};