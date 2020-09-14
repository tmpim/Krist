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

var addresses   = require("./../addresses.js"),
  krist       = require("./../krist.js"),
  errors      = require("./../errors/errors.js");

function AddressesController() {}

AddressesController.getAddresses = function(limit, offset) {
  return new Promise(function(resolve, reject) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
      return reject(new errors.ErrorInvalidParameter("limit"));
    }

    if ((offset && isNaN(offset)) || (offset && offset < 0)) {
      return reject(new errors.ErrorInvalidParameter("offset"));
    }

    addresses.getAddresses(limit, offset).then(resolve).catch(reject);
  });
};

AddressesController.getRich = function(limit, offset) {
  return new Promise(function(resolve, reject) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
      return reject(new errors.ErrorInvalidParameter("limit"));
    }

    if ((offset && isNaN(offset)) || (offset && offset < 0)) {
      return reject(new errors.ErrorInvalidParameter("offset"));
    }

    addresses.getRich(limit, offset).then(resolve).catch(reject);
  });
};

AddressesController.getAddress = function(address) {
  return new Promise(function(resolve, reject) {
    if (!krist.isValidKristAddress(address)) {
      return reject(new errors.ErrorInvalidParameter("address"));
    }

    addresses.getAddress(address).then(function(result) {
      if (!result) {
        return reject(new errors.ErrorAddressNotFound());
      }

      resolve(result);
    }).catch(reject);
  });
};

AddressesController.getAlert = function(privatekey) {
  return new Promise(function(resolve, reject) {
    var address = krist.makeV2Address(privatekey);

    addresses.getAddress(address).then(function(result) {
      if (!result) {
        return reject(new errors.ErrorAddressNotFound());
      }

      resolve(result.alert);
    }).catch(reject);
  });
};

AddressesController.addressToJSON = function(address) {
  return {
    address: address.address.toLowerCase(),
    balance: address.balance,
    totalin: address.totalin,
    totalout: address.totalout,
    firstseen: address.firstseen
  };
};

module.exports = AddressesController;
