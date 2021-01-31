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
const schemas    = require("./schemas.js");
const websockets = require("./websockets.js");
const addresses  = require("./addresses.js");
const { Op }     = require("sequelize");

const promClient = require("prom-client");
const promTransactionCounter = new promClient.Counter({
  name: "krist_transactions_total",
  help: "Total number of transactions since the Krist server started.",
  labelNames: ["type"]
});

// Initialize the counters to prevent 'no data' in Grafana
promTransactionCounter.inc({ type: "unknown" }, 0);
promTransactionCounter.inc({ type: "mined" }, 0);
promTransactionCounter.inc({ type: "name_purchase" }, 0);
promTransactionCounter.inc({ type: "name_a_record" }, 0);
promTransactionCounter.inc({ type: "name_transfer" }, 0);
promTransactionCounter.inc({ type: "transfer" }, 0);

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

Transactions.lookupTransactions = function(addressList, limit, offset, orderBy, order, includeMined) {
  return schemas.transaction.findAndCountAll({
    order: [[orderBy || "id", order || "ASC"]],
    limit: utils.sanitiseLimit(limit),
    offset: utils.sanitiseOffset(offset),
    where: includeMined
      ? {[Op.or]: [{ from: {[Op.in]: addressList} }, { to: {[Op.in]: addressList} }]}
      : {[Op.or]: [
        { from: {[Op.in]: addressList} },
        { 
          from: EXCLUDE_MINED, 
          to: {[Op.in]: addressList}
        } 
      ]}
  });
};

Transactions.createTransaction = async function (to, from, value, name, op, dbTx) {
  // Create the new transaction object
  const newTransaction = await schemas.transaction.create({
    to,
    from,
    value,
    name,
    time: new Date(),
    op
  }, { transaction: dbTx });

  promTransactionCounter.inc({ 
    type: Transactions.identifyTransactionType(newTransaction) 
  });

  // Broadcast the transaction to websockets subscribed to transactions (async)
  websockets.broadcastEvent({
    type: "event",
    event: "transaction",
    transaction: Transactions.transactionToJSON(newTransaction)
  });

  return newTransaction;
};

Transactions.pushTransaction = async function(sender, recipientAddress, amount, metadata, name, dbTx) {
  const recipient = await addresses.getAddress(recipientAddress);

  // Do these in parallel:
  const [,, newTransaction] = await Promise.all([
    // Decrease the sender's own balance
    sender.decrement({ balance: amount }, { transaction: dbTx }),
    // Increase the sender's totalout
    sender.increment({ totalout: amount }, { transaction: dbTx }),

    // Create the transaction
    Transactions.createTransaction(recipientAddress, sender.address, amount, name, metadata, dbTx),

    // Create the recipient if they don't exist, 
    !recipient
      ? schemas.address.create({
        address: recipientAddress.toLowerCase(),
        firstseen: new Date(),
        balance: amount,
        totalin: amount,
        totalout: 0
      }, { transaction: dbTx })
    // Otherwise, increment their balance and totalin
      : recipient.increment({ balance: amount, totalin: amount }, { transaction: dbTx })
  ]);

  return newTransaction;
};

Transactions.identifyTransactionType = function(transaction) {
  if (!transaction) return "unknown";
  if (!transaction.from) return "mined";

  if (transaction.name) {
    if (transaction.to === "name") return "name_purchase";
    else if (transaction.to === "a") return "name_a_record";
    else return "name_transfer";
  }

  return "transfer";
};

Transactions.transactionToJSON = function(transaction) {
  return {
    id: transaction.id,
    from: transaction.from,
    to: transaction.to,
    value: transaction.value,
    time: transaction.time,
    name: transaction.name,
    metadata: transaction.op,
    type: Transactions.identifyTransactionType(transaction)
  };
};

module.exports = Transactions;
