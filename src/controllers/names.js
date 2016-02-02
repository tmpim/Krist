var names       = require('./../names.js'),
	addresses   = require('./../addresses.js'),
	errors      = require('./../errors/errors.js');

function NamesController() {}

NamesController.getNamesByAddress = function(address, limit, offset) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		addresses.getAddress(address).then(function(addr) {
			if (addr) {
				names.getNamesByAddress(addr.address, limit, offset).then(resolve).catch(reject);
			} else {
				reject(new errors.ErrorAddressNotFound());
			}
		}).catch(reject);
	});
};

NamesController.nameToJSON = function(name) {
	return {
		name: name.name,
		owner: name.owner,
		registered: name.registered,
		updated: name.updated,
		a: name.a
	};
};

module.exports = NamesController;