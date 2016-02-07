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