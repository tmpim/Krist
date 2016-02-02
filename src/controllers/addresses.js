var addresses   = require('./../addresses.js'),
	errors      = require('./../errors/errors.js');

function AddressesController() {}

AddressesController.getAddresses = function(limit, offset) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		addresses.getAddresses(limit, offset).then(resolve).catch(reject);
	});
};

AddressesController.getRich = function(limit, offset) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		addresses.getRich(limit, offset).then(resolve).catch(reject);
	});
};

AddressesController.addressToJSON = function(address) {
	return {
		address: address.address.toLowerCase(),
		balance: address.balance,
		totalin: address.totalin,
		totalout: address.totalout,
		firstseen: address.firstseen,
	};
};

module.exports = AddressesController;