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

const express = require("express");
const Krist   = require("../krist");
const utils   = require("../utils");

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

async function parseQuery(query) {
  const matchAddress = Krist.isValidKristAddress(query);
  const matchName = Krist.isValidKristAddress(query);
}

async function performSearch(query) {

}

module.exports = function(app) {
  const api = express.Router();

  // Error handler
  // eslint-disable-next-line no-unused-vars
  api.use((err, req, res, next) => {
    utils.sendErrorToRes(req, res, err);
  });

  app.use("/search", api);
};
