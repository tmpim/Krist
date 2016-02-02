var utils       = require('./utils.js'),
	schemas     = require('./schemas.js');

function Addresses() {}

Addresses.getAddress = function(address) {
	return schemas.address.findOne({where: {address: address}});
};

Addresses.getAddresses = function(limit, offset) {
	return schemas.address.findAll({ limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Addresses.getRich = function() {
	return schemas.address.findAll({limit: 50, order: 'balance DESC'});
};

module.exports = Addresses;
