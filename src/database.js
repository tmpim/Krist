var	config		= require('./../config.js'),
	Sequelize	= require('sequelize'),
	fs			= require('fs'),
	path 		= require('path');

function Database() {}

module.exports = Database;

Database.getSequelize = function() {
	return Database.sequelize;
};

Database.init = function() {
	return new Promise(function(resolve) {
		var requiredConfigOptions = [
			'databaseHost',
			'databaseDB',
			'databaseUser',
			'databasePass'
		];

		requiredConfigOptions.forEach(function(option) {
			if (!config[option]) {
				console.error('[Config]'.red + ' Missing config option: ' + option);

				process.exit(1);
			}
		});

		console.log('[DB]'.cyan + ' Connecting...');

		Database.sequelize = new Sequelize(config.databaseDB, config.databaseUser, config.databasePass, {
			host: config.databaseHost,
			dialect: config.databaseDialect,
			logging: false,
			pool: {
				max: 6,
				min: 2,
				idle: 10000
			}
		});

		console.log('[DB]'.green + ' Connected');

		resolve();
	});
};