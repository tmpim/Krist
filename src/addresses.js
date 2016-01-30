var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	krist       = require('./krist.js');

function Addresses() {}

Addresses.getAddress = function(address) {
	return schemas.address.findOne({where: {address: address}});
};

Addresses.getAddresses = function(limit, offset) {
	return schemas.address.findAll({limit: typeof limit !== 'undefined' ? parseInt(limit) : null, offset: typeof offset !== 'undefined' ? parseInt(offset) : null});
};

Addresses.getRich = function() {
	return schemas.address.findAll({limit: 50, order: 'balance DESC'});
};

module.exports = Addresses;
