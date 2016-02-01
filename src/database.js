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
			'database_host',
			'database_db',
			'database_user',
			'database_pass'
		];

		requiredConfigOptions.forEach(function(option) {
			if (!config[option]) {
				console.error('[Config]'.red + ' Missing config option: ' + option);

				process.exit(1);
			}
		});

		console.log('[DB]'.cyan + ' Connecting...');

		Database.sequelize = new Sequelize(config.database_db, config.database_user, config.database_pass, {
			host: config.database_host,
			dialect: config.database_dialect,
			logging: false,
			pool: {
				max: 5,
				min: 1,
				idle: 10000
			}
		});

		console.log('[DB]'.green + ' Connected');

		resolve();
	});
};