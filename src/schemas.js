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

var	Sequelize	= require('sequelize'),
	config		= require('./../config.js'),
	database	= require('./database.js');

var Address = database.getSequelize().define('address', {
	address: Sequelize.STRING(10),
	balance: Sequelize.INTEGER.UNSIGNED,
	totalin: Sequelize.INTEGER.UNSIGNED,
	totalout: Sequelize.INTEGER.UNSIGNED,
	firstseen: Sequelize.DATE,
	privatekey: {
		type: Sequelize.STRING(64),
		allowNull: true
	}
}, {
	timestamps: false
});

var Block = database.getSequelize().define('block', {
	value: Sequelize.INTEGER.UNSIGNED,
	hash: {
		type: Sequelize.STRING(64),
		unique: true
	},
	address: Sequelize.STRING(10),
	nonce: Sequelize.STRING(config.nonceMaxSize || 24),
	time: Sequelize.DATE,
	difficulty: Sequelize.INTEGER(10).UNSIGNED,
	useragent: Sequelize.STRING(255)
}, {
	timestamps: false
});

var Name = database.getSequelize().define('name', {
	name: Sequelize.STRING(64),
	owner: Sequelize.STRING(10),
	registered: Sequelize.DATE,
	updated: Sequelize.DATE,
	a: Sequelize.STRING,
	unpaid: Sequelize.INTEGER.UNSIGNED
}, {
	timestamps: false
});

var Transaction = database.getSequelize().define('transaction', {
	from: Sequelize.STRING(10),
	to: Sequelize.STRING(10),
	value: Sequelize.INTEGER.UNSIGNED,
	time: Sequelize.DATE,
	name: Sequelize.STRING(64),
	op: Sequelize.STRING
}, {
	timestamps: false
});

var Webhook = database.getSequelize().define('webhook', {
	event: Sequelize.ENUM('transaction', 'block', 'name'),
	value: {
		type: Sequelize.STRING(255),
		allowNull: true
	},
	url: Sequelize.STRING(255),
	method: Sequelize.ENUM('get', 'post'),
	owner: Sequelize.STRING(10),
	token: Sequelize.STRING(16)
}, {
	timestamps: false
});

Address.sync();
Block.sync();
Name.sync();
Transaction.sync();
Webhook.sync();

module.exports = {
	address: Address,
	block: Block,
	name: Name,
	transaction: Transaction,
	webhook: Webhook
};