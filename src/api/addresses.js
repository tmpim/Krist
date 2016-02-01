var addresses   = require('./../addresses.js'),
	errors      = require('./../errors/errors.js');

function AddressAPI() {}

AddressAPI.getAddresses = function(limit, offset) {
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

AddressAPI.getRich = function(limit, offset) {
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

module.exports = AddressAPI;