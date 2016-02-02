var config		= require('./config.js'),
	package     = require('./package.json'),

	colors		= require('colors'), // *colours

	errors      = require('./src/errors/errors.js'),
	database	= require('./src/database.js');

console.log('Starting ' + package.name.bold + ' ' + package.version.blue + '...');

database.init().then(function() {
	require('./src/krist.js').init();
	require('./src/webserver.js').init();
});