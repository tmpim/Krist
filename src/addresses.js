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

Addresses.verify = function(kristAddress, privatekey) {
	return new Promise(function(resolve, reject) {
		Addresses.getAddress(kristAddress).then(function(address) {
			if (!address) {
				schemas.address.create({
					address: kristAddress,
					firstseen: new Date(),
					balance: 0,
					totalin: 0,
					totalout: 0,
					privatekey: utils.sha256(kristAddress + privatekey)
				}).then(function(addr) {
					resolve({
						authed: true,
						address: addr
					});
				}).catch(reject);

				return;
			}

			if (address.privatekey) {
				resolve({
					authed: address.privatekey === utils.sha256(kristAddress + privatekey),
					address: address
				});
			} else {
				address.update({
					privatekey: utils.sha256(kristAddress + privatekey)
				}).then(function(addr) {
					resolve({
						authed: true,
						address: addr
					});
				}).catch(reject);
			}
		});
	});
};

module.exports = Addresses;
