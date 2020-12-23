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

const utils   = require("./utils.js");
const schemas = require("./schemas.js");

const promClient = require("prom-client");
const promAddressesVerifiedCounter = new promClient.Counter({
  name: "krist_addresses_verified_total",
  help: "Total number of addresses verified since the Krist server started.",
  labelNames: ["type"]
});

promAddressesVerifiedCounter.inc({ type: "attempt" }, 0);
promAddressesVerifiedCounter.inc({ type: "failed" }, 0);
promAddressesVerifiedCounter.inc({ type: "authed" }, 0);

function Addresses() {}

Addresses.getAddress = function(address) {
  return schemas.address.findOne({where: {address: address}});
};

Addresses.getAddresses = function(limit, offset) {
  return schemas.address.findAndCountAll({limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Addresses.lookupAddresses = function(addressList) {
  return schemas.address.findAll({ where: { address: addressList } });
};

Addresses.getRich = function(limit, offset) {
  return schemas.address.findAndCountAll({limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset), order: [["balance", "DESC"]]});
};

Addresses.verify = async function(kristAddress, privatekey) {
  promAddressesVerifiedCounter.inc({ type: "attempt" });

  const hash = utils.sha256(kristAddress + privatekey);
  const address = await Addresses.getAddress(kristAddress);
  if (!address) { // Unseen address, create it
    const newAddress = await schemas.address.create({
      address: kristAddress,
      firstseen: new Date(),
      balance: 0, totalin: 0, totalout: 0,
      privatekey: hash
    });

    promAddressesVerifiedCounter.inc({ type: "authed" });
    return { authed: true, address: newAddress };
  }

  if (address.privatekey) { // Address exists, auth if the privatekey is equal
    const authed = address.privatekey === hash;
    promAddressesVerifiedCounter.inc({ type: authed ? "authed" : "failed" });
    return { authed, address };
  } else { // Address doesn't yet have a privatekey, claim it as the first
    const updatedAddress = await address.update({ privatekey: hash });
    promAddressesVerifiedCounter.inc({ type: "authed" });
    return { authed: true, address: updatedAddress };
  }
};

Addresses.addressToJSON = function(address) {
  return {
    address: address.address.toLowerCase(),
    balance: address.balance,
    totalin: address.totalin,
    totalout: address.totalout,
    firstseen: address.firstseen
  };
};

module.exports = Addresses;
