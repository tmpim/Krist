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

const transactions = require("./../transactions.js");
const addresses    = require("./../addresses.js");
const krist        = require("./../krist.js");
const names        = require("./../names.js");
const errors       = require("./../errors/errors.js");

function TransactionsController() {}

TransactionsController.getTransactions = async function (limit, offset, asc, includeMined) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0))
      throw new errors.ErrorInvalidParameter("limit");

    if ((offset && isNaN(offset)) || (offset && offset < 0))
      throw new errors.ErrorInvalidParameter("offset");

    return transactions.getTransactions(limit, offset, asc, includeMined);
};

TransactionsController.getTransactionsByAddress = async function(address, limit, offset, includeMined) {
  if ((limit && isNaN(limit)) || (limit && limit <= 0))
    throw new errors.ErrorInvalidParameter("limit");

  if ((offset && isNaN(offset)) || (offset && offset < 0))
    throw new errors.ErrorInvalidParameter("offset");

  const addr = await addresses.getAddress(address)
  if (!addr)
    throw new errors.ErrorAddressNotFound();
  
  return transactions.getTransactionsByAddress(addr.address, limit, offset, includeMined)
};

TransactionsController.getTransaction = async function(id) {
  if (isNaN(id))
    throw new errors.ErrorInvalidParameter("id");

  id = Math.max(parseInt(id), 0);

  const result = await transactions.getTransaction(id)
  if (!result)
    throw new errors.ErrorTransactionNotFound();
  
  return result;
};

TransactionsController.makeTransaction = async function(req, privatekey, to, amount, metadata) {
  // Input validation
  if (!privatekey) throw new errors.ErrorMissingParameter("privatekey");
  if (!to) throw new errors.ErrorMissingParameter("to");
  if (!amount) throw new errors.ErrorMissingParameter("amount");
  
  // Check if we're paying to a name
  const isName = krist.nameMetaRegex.test(to.toLowerCase());
  let nameInfo;

  if (isName) {
    nameInfo = krist.nameMetaRegex.exec(to.toLowerCase());
  } else { // Verify this is a valid address
    if (!krist.isValidKristAddress(to)) throw new errors.ErrorInvalidParameter("to");
  }
  
  if (isNaN(amount) || amount < 1) throw new errors.ErrorInvalidParameter("amount");
  if (metadata && (!/^[\x20-\x7F\n]+$/i.test(metadata) || metadata.length > 255)) 
    throw new errors.ErrorInvalidParameter("metadata");

  const from = krist.makeV2Address(privatekey);
  amount = parseInt(amount);

  // Address auth validation
  const { authed, address: sender } = await addresses.verify(req, from, privatekey);
  if (!authed) throw new errors.ErrorAuthFailed();

  // Reject insufficient funds
  if (!sender || sender.balance < amount) throw new errors.ErrorInsufficientFunds();

  // If this is a name, pay to the owner of the name
  if (isName) {
    // Fetch the name
    const dbName = await names.getNameByName(nameInfo[2]);
    if (!dbName) throw new errors.ErrorNameNotFound();

    // Add the original name spec to the metadata 
    if (metadata) { // Append with a semicolon if we already have metadata
      metadata = to.toLowerCase() + ";" + metadata;
    } else { // Set new metadata otherwise
      metadata = to.toLowerCase();
    }

    // Create the transaction to the name's owner
    return transactions.pushTransaction(sender, dbName.owner, amount, metadata);
  } else {
    // Create the transaction to the provided address
    return transactions.pushTransaction(sender, to, amount, metadata);
  }
};

TransactionsController.transactionToJSON = function(transaction) {
  return transactions.transactionToJSON(transaction);
};

module.exports = TransactionsController;
