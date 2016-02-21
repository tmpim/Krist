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

var utils       = require('./utils.js'),
	schemas     = require('./schemas.js');

function Addresses() {}

Addresses.getAddress = function(address) {
	return schemas.address.findOne({where: {address: address}});
};

Addresses.getAddresses = function(limit, offset) {
	return schemas.address.findAll({ limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Addresses.getAddressCount = function() {
	return schemas.address.count();
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
