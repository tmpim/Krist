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

const utils      = require("./utils.js");
const config     = require("./../config.js");
const schemas    = require("./schemas.js");
const websockets = require("./websockets.js");
const addresses  = require("./addresses.js");
const krist      = require("./krist.js");
const { Op }     = require("sequelize");

// Query operator to exclude mined transactions in the 'from' field
const EXCLUDE_MINED = {
  [Op.notIn]: ["", " "], // From field that isn't a blank string or a space
  [Op.not]: null // And is not null
};

function Transactions() {}

Transactions.getTransaction = function(id) {
  return schemas.transaction.findByPk(id);
};

Transactions.getTransactions = function (limit, offset, asc, includeMined) {
  return schemas.transaction.findAndCountAll({
    order: [["id", asc ? "ASC" : "DESC"]],
    limit: utils.sanitiseLimit(limit),
    offset: utils.sanitiseOffset(offset),
    where: includeMined ? {} : { from: EXCLUDE_MINED }
  });
};

Transactions.getRecentTransactions = function(limit, offset) {
  return schemas.transaction.findAll({
    order: [["id", "DESC"]], 
    limit: utils.sanitiseLimit(limit, 100), 
    offset: utils.sanitiseOffset(offset), 
    where: { from: EXCLUDE_MINED }
  });
};

Transactions.getTransactionsByAddress = function(address, limit, offset, includeMined) {
  return schemas.transaction.findAndCountAll({
    order: [["id", "DESC"]],
    limit: utils.sanitiseLimit(limit),
    offset: utils.sanitiseOffset(offset),
    where: includeMined
      // When including mined transactions, we only care if from or to is the
      // queried address:
      ? {[Op.or]: [{ from: address }, { to: address }]}
      // However, when we exclude mined transactions, we care about the
      // transactions from the queried address, or transactions to it from a
      // non-null sender (mined transactions):
      : {[Op.or]: [
        { from: address }, // Transactions from this address
        { // Non-mined txes to this address
          from: EXCLUDE_MINED, // Non-blank from
          to: address
        } 
      ]}
  });
};

Transactions.createTransaction = function (to, from, value, name, op, dbTx) {
  return new Promise(function(resolve, reject) {
    schemas.transaction.create({
      to,
      from,
      value,
      name,
      time: new Date(),
      op
    }, { transaction: dbTx }).then(function(transaction) {
      websockets.broadcastEvent({
        type: "event",
        event: "transaction",
        transaction: Transactions.transactionToJSON(transaction)
      }, function(ws) {
        return new Promise(function(resolve, reject) {
          if ((!ws.isGuest && (ws.auth === to || ws.auth === from) && ws.subscriptionLevel.indexOf("ownTransactions") >= 0) || ws.subscriptionLevel.indexOf("transactions") >= 0) {
            return resolve();
          }

          reject();
        });
      });

      resolve(transaction);
    }).catch(reject);
  });
};

Transactions.pushTransaction = function(sender, recipientAddress, amount, metadata, name) {
  return new Promise(function(resolve, reject) {
    addresses.getAddress(recipientAddress).then(function(recipient) {
      const promises = [];

      promises.push(sender.decrement({ balance: amount }));
      promises.push(sender.increment({ totalout: amount }));

      promises.push(Transactions.createTransaction(recipientAddress, sender.address, amount, name, metadata));

      if (!recipient) {
        promises.push(schemas.address.create({
          address: recipientAddress.toLowerCase(),
          firstseen: new Date(),
          balance: amount,
          totalin: amount,
          totalout: 0
        }));
      } else {
        promises.push(recipient.increment({ balance: amount, totalin: amount }));
      }

      Promise.all(promises).then(function(results) {
        resolve(results[2]);
      }).catch(reject);
    }).catch(reject);
  });
};

Transactions.transactionToJSON = function(transaction) {
  return {
    id: transaction.id,
    from: transaction.from,
    to: transaction.to,
    value: transaction.value,
    time: transaction.time,
    name: transaction.name,
    metadata: transaction.op
  };
};

module.exports = Transactions;
