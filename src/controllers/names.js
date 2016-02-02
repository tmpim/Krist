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
	if (!krist.isValidName(name)) {
		return reject(new errors.ErrorInvalidParameter('name'));
	}

	if (!privatekey) {
		return reject(new errors.ErrorMissingParameter('privatekey'));
	}

	var desiredName = req.params.name.toLowerCase();

	names.getNameByName(desiredName).then(function(name) {
		if (name) {
			return reject(new errors.ErrorNameTaken());
		}

		addresses.getAddress(krist.makeV2Address(req.body.privatekey)).then(function(address) {
			if (!address || address.balance < names.getNameCost()) {
				return reject(new errors.ErrorInsufficientFunds());
			}

			var promises = [];

			promises.push(address.decrement({ balance: names.getNameCost() }));
			promises.push(address.increment({ totalout: names.getNameCost() }));

			promises.push(tx.createTransaction('name', address.address, names.getNameCost(), desiredName, null));
			promises.push(names.createName(desiredName, address.address));

			Promise.all(promises).then(resolve).catch(reject);
		}).catch(reject);
	}).catch(reject);
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