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

const chalk     = require("chalk");
const utils     = require("./utils.js");
const schemas   = require("./schemas.js");
const Sequelize = require("sequelize");
const { Op }    = require("sequelize");

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

/** For privacy reasons, purge entries from the auth log older than 30 days. */
Addresses.cleanAuthLog = async function() {
  const destroyed = await schemas.authLog.destroy({
    where: {
      time: { [Op.lte]: Sequelize.literal('NOW() - INTERVAL 30 DAY')}
    }
  });
  console.log(chalk`{cyan [Auth]} Purged {bold ${destroyed}} auth log entries`);
}

Addresses.logAuth = async function(req, address, type) {
  const { ip, path, logDetails } = utils.getLogDetails(req);

  if (type === "auth") {
    console.log(chalk`{green [Auth]} ({bold ${path}}) Successful auth on address {bold ${address}} ${logDetails}`);
  }

  // Check if there's already a recent log entry with these details. If there
  // were any within the last 30 minutes, don't add any new ones.
  const existing = await schemas.authLog.findOne({
    where: {
      ip, 
      address,
      time: { [Op.gte]: Sequelize.literal('NOW() - INTERVAL 30 MINUTE')},
      type
    }
  });
  if (existing) return;

  schemas.authLog.create({
    ip, address, time: new Date(), type
  });
}

Addresses.verify = async function(req, kristAddress, privatekey) {
  const { ip, origin, path, logDetails } = utils.getLogDetails(req);

  console.log(chalk`{cyan [Auth]} ({bold ${path}}) Auth attempt on address {bold ${kristAddress}} ${logDetails}`);
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

    Addresses.logAuth(req, kristAddress, "auth");
    promAddressesVerifiedCounter.inc({ type: "authed" });
    return { authed: true, address: newAddress };
  }

  if (address.privatekey) { // Address exists, auth if the privatekey is equal
    const authed = address.privatekey === hash;

    if (authed) Addresses.logAuth(req, kristAddress, "auth");      
    else console.log(chalk`{red [Auth]} ({bold ${path}}) Auth failed on address {bold ${kristAddress}} ${logDetails}`);      

    promAddressesVerifiedCounter.inc({ type: authed ? "authed" : "failed" });
    return { authed, address };
  } else { // Address doesn't yet have a privatekey, claim it as the first
    const updatedAddress = await address.update({ privatekey: hash });

    Addresses.logAuth(req, kristAddress, "auth");
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
