/**
 * Created by Drew Lemmy, 2016-2021
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
 * For more project information, see <https://github.com/tmpim/krist>.
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

NamesController.registerName = async function(req, desiredName, privatekey) {
  // Input validation
  if (!desiredName) throw new errors.ErrorMissingParameter("name");
  if (!privatekey) throw new errors.ErrorMissingParameter("privatekey");

  if (!krist.isValidName(desiredName)) throw new errors.ErrorInvalidParameter("name");

  // Address auth validation
  const { authed, address: dbAddress } = await addresses.verify(req, krist.makeV2Address(privatekey), privatekey);
  if (!authed) throw new errors.ErrorAuthFailed();

  // Check if the name already exists
  if (await names.getNameByName(desiredName))
    throw new errors.ErrorNameTaken();

  // Reject insufficient funds
  if (dbAddress.balance < names.getNameCost())
    throw new errors.ErrorInsufficientFunds();

  // Do these actions in parallel
  const [,,, dbName] = await Promise.all([
    // Decrease the purchaser's balance and increase their totalout
    dbAddress.decrement({ balance: names.getNameCost() }),
    dbAddress.increment({ totalout: names.getNameCost() }),

    // Create the name transaction
    tx.createTransaction("name", dbAddress.address, names.getNameCost(), desiredName, null),

    // Create the name itself
    names.createName(desiredName, dbAddress.address)
  ]);

  // Return the new name
  return dbName;
};

NamesController.transferName = async function(req, name, privatekey, address) {
  // Input validation
  if (!name) throw new errors.ErrorMissingParameter("name");
  if (!privatekey) throw new errors.ErrorMissingParameter("privatekey");
  if (!address) throw new errors.ErrorMissingParameter("address");

  if (!krist.isValidName(name)) throw new errors.ErrorInvalidParameter("name");
  if (!krist.isValidKristAddress(address, true)) throw new errors.ErrorInvalidParameter("address");

  // Address auth validation
  const { authed, address: dbAddress } = await addresses.verify(req, krist.makeV2Address(privatekey), privatekey);
  if (!authed) throw new errors.ErrorAuthFailed();

  // Get the name from the database
  const dbName = await names.getNameByName(name);
  if (!dbName) throw new errors.ErrorNameNotFound();
  if (dbName.owner !== dbAddress.address) throw new errors.ErrorNotNameOwner();

  // Do these actions in parallel
  await Promise.all([
    // Update the name's owner
    // NOTE: original_owner is only updated if it was previously null. There's
    //       only a small number of names that the original owner couldn't be
    //       found for.
    dbName.update({
      owner: address,
      updated: new Date(),

      // If the name did not have an original owner for some reason, use the
      // current owner.
      ...(dbName.original_owner ? {} : { original_owner: dbName.owner })
    }),

    // Add a name meta transaction
    tx.pushTransaction(dbAddress, address, 0, null, dbName.name)
  ]);

  // Return the updated name
  return dbName.reload();
};

NamesController.updateName = async function(req, name, privatekey, a) {
  a = a || ""; // Replace with an empty string if given anything falsy

  // Input validation
  if (!name) throw new errors.ErrorMissingParameter("name");
  if (!privatekey) throw new errors.ErrorMissingParameter("privatekey");

  if (!krist.isValidName(name)) throw new errors.ErrorInvalidParameter("name");
  if (a.trim() && !krist.isValidARecord(a)) throw new errors.ErrorInvalidParameter("a");

  // Address auth validation
  const { authed, address: dbAddress } = await addresses.verify(req, krist.makeV2Address(privatekey), privatekey);
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
