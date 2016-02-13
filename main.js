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
	console.log(error);
});

redis.init().then(function() {
	database.init().then(function() {
		webserver.init().then(function() {
			require('./src/krist.js').init();
		});
	});
});