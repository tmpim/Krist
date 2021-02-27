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

  if (process.env.NODE_ENV !== "test") {
    api.use(rateLimit({
      windowMs: 30000, delayAfter: 10, delayMs: 250, max: 15,
      message: "Rate limit hit. Please try again later."
    }));
  }

  /**
   * @apiDefine SearchQuery
   *
   * @apiSuccess {Object} query Information about the way the search query was
   *   interpreted.
   * @apiSuccess {String} query.originalQuery The original (sanitised) query
   *   text.
   * @apiSuccess {Boolean} query.matchAddress Whether or not the query exactly
   *   matches the format of a Krist address.
   * @apiSuccess {Boolean} query.matchName Whether or not the query exactly
   *   matches the format of a Krist name (with or without the `.kst`) suffix.
   * @apiSuccess {Boolean} query.matchBlock Whether or not the query exactly
   *   matches the format of a block ID (with all non-numbers removed).
   * @apiSuccess {Boolean} query.matchTransaction Whether or not the query
   *   exactly matches the format of a transaction ID (with all non-numbers
   *   removed).
   * @apiSuccess {String} query.strippedName The query with the `.kst` suffix
   *   stripped, if it was present.
   * @apiSuccess {Boolean} query.hasID Whether or not the query looks like an ID
   *   number (e.g. for blocks or transactions).
   * @apiSuccess {Number} [query.cleanID] If hasID is true, this is the query,
   *   sanitised and converted to a number.
   */

  /**
   * @api {get} /search Search the Krist network
   * @apiName Search
   * @apiGroup LookupGroup
   * @apiVersion 2.8.0
   *
   * @apiDescription Search the Krist network for objects that match the given
   * query, including addresses, names, blocks, and transactions.
   *
   * - Addresses are searched by exact address match only
   * - Names are searched by their name with and without the `.kst` suffix
   * - Blocks are searched by ID
   * - Transactions are searched by ID
   *
   * For more advanced transaction searches (by involved addresses and
   * metadata), see the `/search/extended` endpoint.
   *
   * **WARNING:** The Lookup API is in Beta, and is subject to change at any
   * time without warning.
   *
	 * @apiParam (QueryParameter) {String} q The search query.
   *
   * @apiUse SearchQuery
   *
   * @apiSuccess {Object} matches The results of the search query.
   * @apiSuccess {Object} matches.exactAddress An exact address match - this
   *   will be an Address object if the query looked like a valid Krist address,
   *   and that address exists in the database. Otherwise, if there is no
   *   result, it will be `false`.
   * @apiSuccess {Object} matches.exactName An exact name match - this will be a
   *   Name object if the query looked like a valid Krist name (with or without
   *   the `.kst` suffix), and that name exists in the database. Otherwise, if
   *   there is no result, it will be `false`.
   * @apiSuccess {Object} matches.exactBlock An exact block match - this will be
   *   a Block object if the query looked like a valid Krist block ID, and that
   *   block exists in the database. Otherwise, if there is no result, it will
   *   be `false`.
   * @apiSuccess {Object} matches.exactTransaction An exact transaction match -
   *   this will be a Transaction object if the query looked like a valid Krist
   *   transaction ID, and that transaction exists in the database. Otherwise,
   *   if there is no result, it will be `false`.
   *
   * @apiSuccessExample {json} Success - Name result
   * {
   *   "ok": true,
   *   "query": {
   *     "originalQuery": "example",
   *     "matchAddress": false,
   *     "matchName": true,
   *     "matchBlock": false,
   *     "matchTransaction": false,
   *     "strippedName": "example",
   *     "hasID": false
   *   },
   *   "matches": {
   *     "exactAddress": false,
   *     "exactName": {
   *       "name": "example",
   *       "owner": "kxxxxxxxxx",
   *       "registered": "2015-05-24T00:49:04.000Z",
   *       "updated": "2020-01-04T05:09:11.000Z",
   *       "a": null
   *     },
   *     "exactBlock": false,
   *     "exactTransaction": false
   *   }
   * }
   *
   * @apiSuccessExample {json} Success - ID lookup result
   * {
   *   "ok": true,
   *   "query": {
   *     "originalQuery": "1234",
   *     "matchAddress": false,
   *     "matchName": true,
   *     "matchBlock": true,
   *     "matchTransaction": true,
   *     "strippedName": "1234",
   *     "hasID": true,
   *     "cleanID": 1234
   *   },
   *   "matches": {
   *     "exactAddress": false,
   *     "exactName": {
   *       "name": "1234",
   *       "owner": "krazedrugz",
   *       "registered": "2016-10-07T15:55:48.000Z",
   *       "updated": "2016-10-07T15:55:48.000Z",
   *       "a": null
   *     },
   *     "exactBlock": {
   *       "height": 1234,
   *       "address": "2bbb037a6f",
   *       "hash": "01b1b4b7162ec67061760a0f013282b34053b803ad85181d696e8767ed4fa442",
   *       "short_hash": "01b1b4b7162e",
   *       "value": 50,
   *       "time": "2015-02-15T05:37:44.000Z",
   *       "difficulty": 2000000000000
   *     },
   *     "exactTransaction": {
   *       "id": 1234,
   *       "from": null,
   *       "to": "2bbb037a6f",
   *       "value": 50,
   *       "time": "2015-02-15T05:37:40.000Z",
   *       "name": null,
   *       "metadata": null,
   *       "sent_metaname": null,
   *       "sent_name": null,
   *       "type": "mined"
   *     }
   *   }
   * }
   */
  api.get("/", async (req, res) => {
    const query = validateQuery(req);
    const results = await performSearch(query);
    res.json({
      ok: true,
      ...results
    });
  });

  /**
   * @api {get} /search/extended Search transactions
   * @apiName SearchExtended
   * @apiGroup LookupGroup
   * @apiVersion 2.8.0
   *
   * @apiDescription Search the Krist network for transactions that match the
   * given query. The search is more in-depth (and thus slower) than `/search`.
   *
   * - Transactions are searched by address involved (from, to)
   * - Transactions are searched by name involved (either a name
   *   transfer/update, or a transaction to a name)
   * - Transactions are searched by raw metadata (exact query match anywhere in
   *   the metadata)
   *
   * **WARNING:** The Lookup API is in Beta, and is subject to change at any
   * time without warning.
   *
	 * @apiParam (QueryParameter) {String} q The search query.
   *
   * @apiUse SearchQuery
   *
   * @apiSuccess {Object} matches The results of the search query.
   * @apiSuccess {Object} matches.transactions Information about transaction
   *   matches for the search query.
   * @apiSuccess {Number|Boolean} matches.transactions.addressInvolved The
   *   number of transactions that involve the query address (either in the
   *   `from` field or the `to` field), or `false` if the query isn't a valid
   *   Krist address.
   * @apiSuccess {Number|Boolean} matches.transactions.nameInvolved The number
   *   of transactions that involve the query name (either as a direct
   *   transfer/update, or as a transaction sent to a name; the `name` and
   *   `sent_name` fields respectively), or `false` if the query isn't a valid
   *   Krist name.
   * @apiSuccess {Number|Boolean} matches.transactions.metadata The number of
   *   transactions with metadata containing the query string.
   *
   * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "query": {
   *     "originalQuery": "sc.kst",
   *     "matchAddress": false,
   *     "matchName": true,
   *     "matchBlock": false,
   *     "matchTransaction": false,
   *     "strippedName": "sc",
   *     "hasID": false
   *   },
   *   "matches": {
   *     "transactions": {
   *       "addressInvolved": false,
   *       "nameInvolved": 3361,
   *       "metadata": 3404
   *     }
   *   }
   * }
   */
  api.get("/extended", async (req, res) => {
    const query = validateQuery(req);

    // Don't allow the query to be too short (to not return tens of thousands
    // of results)
    if (query.length < 3) throw new errors.ErrorInvalidParameter("q");

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
