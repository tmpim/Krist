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

const names     = require("./../names.js");
const addresses = require("./../addresses.js");
const tx        = require("./../transactions.js");
const krist     = require("./../krist.js");
const errors    = require("./../errors/errors.js");

function NamesController() {}

NamesController.getNames = function(limit, offset) {
  return new Promise(function(resolve, reject) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
      return reject(new errors.ErrorInvalidParameter("limit"));
    }

    if ((offset && isNaN(offset)) || (offset && offset < 0)) {
      return reject(new errors.ErrorInvalidParameter("offset"));
    }

    names.getNames(limit, offset).then(resolve).catch(reject);
  });
};

NamesController.getName = async function(name) {
  if (!krist.isValidName(name))
    throw new errors.ErrorInvalidParameter("name");

  const dbName = await names.getNameByName(name);
  if (dbName) return dbName;
  else throw new errors.ErrorNameNotFound();
};

NamesController.getUnpaidNames = function(limit, offset) {
  return new Promise(function(resolve, reject) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
      return reject(new errors.ErrorInvalidParameter("limit"));
    }

    if ((offset && isNaN(offset)) || (offset && offset < 0)) {
      return reject(new errors.ErrorInvalidParameter("offset"));
    }

    names.getUnpaidNames(limit, offset).then(resolve).catch(reject);
  });
};

NamesController.getNamesByAddress = function(address, limit, offset) {
  return new Promise(function(resolve, reject) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
      return reject(new errors.ErrorInvalidParameter("limit"));
    }

    if ((offset && isNaN(offset)) || (offset && offset < 0)) {
      return reject(new errors.ErrorInvalidParameter("offset"));
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

NamesController.registerName = function(desiredName, privatekey) {
  return new Promise(function(resolve, reject) {
    if (!desiredName) {
      return reject(new errors.ErrorMissingParameter("name"));
    }

    if (!privatekey) {
      return reject(new errors.ErrorMissingParameter("privatekey"));
    }

    if (!krist.isValidName(desiredName)) {
      return reject(new errors.ErrorInvalidParameter("name"));
    }

    addresses.verify(krist.makeV2Address(privatekey), privatekey).then(function(results) {
      const authed = results.authed;
      const address = results.address;

      if (!authed) {
        return reject(new errors.ErrorAuthFailed());
      }

      names.getNameByName(desiredName).then(function (name) {
        if (name) {
          return reject(new errors.ErrorNameTaken());
        }

        if (address.balance < names.getNameCost()) {
          return reject(new errors.ErrorInsufficientFunds());
        }

        const promises = [];

        promises.push(address.decrement({balance: names.getNameCost()}));
        promises.push(address.increment({totalout: names.getNameCost()}));

        promises.push(tx.createTransaction("name", address.address, names.getNameCost(), desiredName, null));
        promises.push(names.createName(desiredName, address.address));

        Promise.all(promises).then(resolve).catch(reject);
      }).catch(reject);
    }).catch(reject);
  });
};

NamesController.transferName = async function(name, privatekey, address) {
  // Input validation
  if (!name) throw new errors.ErrorMissingParameter("name");
  if (!privatekey) throw new errors.ErrorMissingParameter("privatekey");
  if (!address) throw new errors.ErrorMissingParameter("address");

  if (!krist.isValidName(name)) throw new errors.ErrorInvalidParameter("name");
  if (!krist.isValidKristAddress(address)) throw new errors.ErrorInvalidParameter("address");

  // Address auth validation
  const { authed, address: dbAddress } = await addresses.verify(krist.makeV2Address(privatekey), privatekey);
  if (!authed) throw new errors.ErrorAuthFailed();

  // Get the name from the database
  const dbName = await names.getNameByName(name);
  if (!dbName) throw new errors.ErrorNameNotFound();
  if (dbName.owner !== dbAddress.address) throw new errors.ErrorNotNameOwner();

  // Do these actions in parallel
  await Promise.all([
    // Update the name's owner
    dbName.update({
      owner: address,
      updated: new Date()
    }),

    // Add a name meta transaction
    tx.pushTransaction(dbAddress, address, 0, null, dbName.name)
  ]);

  // Return the updated name
  return dbName.reload();
};

NamesController.updateName = async function(name, privatekey, a) {
  a = a || ""; // Replace with an empty string if given anything falsy

  // Input validation
  if (!name) throw new errors.ErrorMissingParameter("name");
  if (!privatekey) throw new errors.ErrorMissingParameter("privatekey");

  if (!krist.isValidName(name)) throw new errors.ErrorInvalidParameter("name");
  if (a.trim() && !krist.isValidARecord(a)) throw new errors.ErrorInvalidParameter("a");

  // Address auth validation
  const { authed, address: dbAddress } = await addresses.verify(krist.makeV2Address(privatekey), privatekey);
  if (!authed) throw new errors.ErrorAuthFailed();

  // Get the name from the database
  const dbName = await names.getNameByName(name);
  if (!dbName) throw new errors.ErrorNameNotFound();
  if (dbName.owner !== dbAddress.address) throw new errors.ErrorNotNameOwner();

  // Do these actions in parallel
  await Promise.all([
    // Update the name's A record
    dbName.update({
      a,
      updated: new Date()
    }),

    // Add a name meta transaction
    tx.createTransaction("a", dbName.owner, 0, dbName.name, a)
  ]);

  // Return the updated name
  return dbName.reload();
};

NamesController.nameToJSON = function(name) {
  return names.nameToJSON(name);
};

module.exports = NamesController;
