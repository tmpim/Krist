/**
 * Created by Drew Lemmy, 2021
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

const express      = require("express");
const rateLimit    = require("express-rate-limit");
const Krist        = require("../krist");
const Addresses    = require("../addresses");
const Names        = require("../names");
const Blocks       = require("../blocks");
const Transactions = require("../transactions");
const errors       = require("../errors/errors");
const utils        = require("../utils");

/*
 * interface SearchQueryMatch {
 *   matchedAddress: boolean;
 *   matchedName: boolean;
 *   matchedBlock: boolean;
 *   matchedTransaction: boolean;
 *
 *   strippedName: string;
 * }
 *
 * interface SearchResult {
 *   query: SearchQueryMatch;
 *
 *   // TODO: I ended up splitting these
 *   matches: {
 *     exactAddress: KristAddress | boolean;
 *     exactName: KristName | boolean;
 *     exactBlock: KristBlock | boolean;
 *     exactTransaction: KristTransaction | boolean;
 *
 *     transactions: {
 *       addressInvolved: number | boolean;
 *       nameInvolved: number | boolean;
 *       metadata: number | boolean;
 *     }
 *   }
 * }
 */

function parseQuery(query) {
  const matchAddress = Krist.isValidKristAddress(query);

  const strippedName = Krist.stripNameSuffix(query);
  const matchName = strippedName && Krist.isValidName(strippedName);

  const cleanID = parseInt(query.replace(/[^\d]/g, ""));
  const hasID = !isNaN(cleanID);
  const matchBlock = hasID;
  const matchTransaction = hasID;

  return {
    originalQuery: query,

    matchAddress,
    matchName,
    matchBlock,
    matchTransaction,

    strippedName,
    hasID,
    ...(hasID ? { cleanID } : {})
  };
}

async function performSearch(query) {
  const parsed = parseQuery(query);
  const {
    matchAddress, matchName, matchBlock, matchTransaction,
    strippedName, cleanID
  } = parsed;

  const [exactAddress, exactName, exactBlock, exactTransaction] = await Promise.all([
    // exactAddress
    matchAddress
      ? Addresses.getAddress(query)
      : false,

    // exactName
    matchName
      ? Names.getNameByName(strippedName)
      : false,

    // exactBlock
    matchBlock
      ? Blocks.getBlock(cleanID)
      : false,

    // exactBlock
    matchTransaction
      ? Transactions.getTransaction(cleanID)
      : false
  ]);

  return {
    query: parsed,
    matches: {
      exactAddress: exactAddress ? Addresses.addressToJSON(exactAddress) : false,
      exactName: exactName ? Names.nameToJSON(exactName) : false,
      exactBlock: exactBlock ? Blocks.blockToJSON(exactBlock) : false,
      exactTransaction: exactTransaction ? Transactions.transactionToJSON(exactTransaction) : false
    }
  };
}

async function performExtendedSearch(query) {
  const parsed = parseQuery(query);
  const { matchAddress, matchName, strippedName } = parsed;

  // Check if the name exists before attempting to search by name
  const name = matchName ? await Names.getNameByName(strippedName) : undefined;

  const [addressInvolved, nameInvolved, metadata] = await Promise.all([
    // addressInvolved
    matchAddress
      ? Transactions.getTransactionsByAddress(query, undefined, undefined, true, true)
      : false,

    // nameInvolved
    matchName && name
      ? Transactions.searchByName(name.name, true)
      : false,

    // metadata
    Transactions.searchMetadata(query, true)
  ]);

  return {
    query: parsed,
    matches: {
      transactions: {
        addressInvolved,
        nameInvolved,
        metadata
      }
    }
  };
}

function validateQuery(req) {
  const query = req.query.q;
  if (!query) throw new errors.ErrorMissingParameter("q");
  if (typeof query !== "string") throw new errors.ErrorInvalidParameter("q");

  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 256) throw new errors.ErrorInvalidParameter("q");

  return trimmedQuery;
}

module.exports = function(app) {
  const api = express.Router();

  if (process.env.NODE_ENV === "production") {
    api.use(rateLimit({
      windowMs: 30000, delayAfter: 10, delayMs: 250, max: 15,
      message: "Rate limit hit. Please try again later."
    }));
  }

  api.get("/", async (req, res) => {
    const query = validateQuery(req);
    const results = await performSearch(query);
    res.json({
      ok: true,
      ...results
    });
  });

  api.get("/extended", async (req, res) => {
    const query = validateQuery(req);
    const results = await performExtendedSearch(query);
    res.json({
      ok: true,
      ...results
    });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  api.use((err, req, res, next) => {
    utils.sendErrorToRes(req, res, err);
  });

  app.use("/search", api);
};
