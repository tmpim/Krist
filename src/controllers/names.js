var names       = require('./../names.js'),
	addresses   = require('./../addresses.js'),
	tx          = require('./../transactions.js'),
	krist       = require('./../krist.js'),
	errors      = require('./../errors/errors.js');

function NamesController() {}

NamesController.getNames = function(limit, offset) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		names.getNames(limit, offset).then(resolve).catch(reject);
	});
};

NamesController.getUnpaidNames = function(limit, offset) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		names.getUnpaidNames(limit, offset).then(resolve).catch(reject);
	});
};

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

NamesController.registerName = function(desiredName, privateKey) {
	return new Promise(function(resolve, reject) {
		if (!desiredName) {
			return reject(new errors.ErrorMissingParameter('name'));
		}

		if (!privateKey) {
			return reject(new errors.ErrorMissingParameter('privatekey'));
		}

		if (!krist.isValidName(desiredName)) {
			return reject(new errors.ErrorInvalidParameter('name'));
		}

		names.getNameByName(desiredName).then(function (name) {
			if (name) {
				return reject(new errors.ErrorNameTaken());
			}

			addresses.getAddress(krist.makeV2Address(privateKey)).then(function (address) {
				if (!address || address.balance < names.getNameCost()) {
					return reject(new errors.ErrorInsufficientFunds());
				}

				var promises = [];

				promises.push(address.decrement({balance: names.getNameCost()}));
				promises.push(address.increment({totalout: names.getNameCost()}));

				promises.push(tx.createTransaction('name', address.address, names.getNameCost(), desiredName, null));
				promises.push(names.createName(desiredName, address.address));

				Promise.all(promises).then(resolve).catch(reject);
			}).catch(reject);
		}).catch(reject);
	});
};

NamesController.transferName = function(name, privateKey, address) {
	return new Promise(function(resolve, reject) {
		if (!name) {
			return reject(new errors.ErrorMissingParameter('name'));
		}

		if (!privateKey) {
			return reject(new errors.ErrorMissingParameter('privatekey'));
		}

		if (!address) {
			return reject(new errors.ErrorMissingParameter('address'));
		}

		if (!krist.isValidName(name)) {
			return reject(new errors.ErrorInvalidParameter('name'));
		}

		if (!krist.isValidKristAddress(address)) {
			return reject(new errors.ErrorInvalidParameter('address'));
		}

		names.getNameByName(name).then(function(name) {
			if (!name) {
				return reject(new errors.ErrorNameNotFound());
			}

			if (name.owner !== krist.makeV2Address(privateKey)) {
				return reject(new errors.ErrorNotNameOwner());
			}

			name.update({
				owner: address,
				updated: new Date()
			}).then(function() {
				name.reload().then(resolve).catch(reject);
			}).catch(reject);
		}).catch(reject);
	});
};

NamesController.updateName = function(name, privateKey, a) {
	return new Promise(function(resolve, reject) {
		if (!name) {
			return reject(new errors.ErrorMissingParameter('name'));
		}

		if (!privateKey) {
			return reject(new errors.ErrorMissingParameter('privatekey'));
		}

		if (!a) {
			return reject(new errors.ErrorMissingParameter('a'));
		}

		if (!krist.isValidName(name)) {
			return reject(new errors.ErrorInvalidParameter('name'));
		}

		if (!krist.isValidARecord(a)) {
			return reject(new errors.ErrorInvalidParameter('a'));
		}

		names.getNameByName(name).then(function (name) {
			if (!name) {
				return reject(new errors.ErrorNameNotFound());
			}

			if (name.owner !== krist.makeV2Address(privateKey)) {
				return reject(new errors.ErrorNotNameOwner());
			}

			name.update({
				a: a,
				updated: new Date()
			}).then(function () {
				name.reload().then(resolve).catch(reject);
			}).catch(reject);
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