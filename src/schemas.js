var	Sequelize	= require('sequelize'),
	database	= require('./database.js');

var Address = database.getSequelize().define('address', {
	address: Sequelize.STRING(10),
	balance: Sequelize.INTEGER.UNSIGNED,
	totalin: Sequelize.INTEGER.UNSIGNED,
	totalout: Sequelize.INTEGER.UNSIGNED,
	firstseen: Sequelize.DATE
}, {
	timestamps: false
});

var Block = database.getSequelize().define('block', {
	value: Sequelize.INTEGER.UNSIGNED,
	hash: Sequelize.STRING(64),
	address: Sequelize.STRING(10),
	nonce: Sequelize.STRING(24),
	time: Sequelize.DATE,
	difficulty: Sequelize.INTEGER(10).UNSIGNED
}, {
	timestamps: false
});

var Name = database.getSequelize().define('name', {
	name: Sequelize.STRING(64),
	owner: Sequelize.STRING(10),
	registered: Sequelize.DATE,
	updated: Sequelize.DATE,
	a: Sequelize.STRING,
	unpaid: Sequelize.BOOLEAN
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
	type: Sequelize.ENUM('transaction', 'block'),
	value: Sequelize.STRING(255),
	url: {
		type: Sequelize.STRING(255),
		validate: {
			isUrl: true
		},
		unique: true
	}
}, {
	timestamps: false
});

Address.sync();
Block.sync();
Name.sync();
Transaction.sync();

module.exports = {
	address: Address,
	block: Block,
	name: Name,
	transaction: Transaction
};