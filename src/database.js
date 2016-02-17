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

		console.log('[DB]'.cyan + ' Connecting to database ' + config.databaseDB.bold + ' as user ' + config.databaseUser.bold + '...');

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