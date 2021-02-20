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

const constants = require("./../constants.js");
const blocks    = require("./../blocks.js");
const krist     = require("./../krist.js");
const utils     = require("./../utils.js");
const errors    = require("./../errors/errors.js");

function BlocksController() {}

BlocksController.getBlocks = async function(limit, offset, asc) {
  if ((limit && isNaN(limit)) || (limit && limit <= 0))
    throw new errors.ErrorInvalidParameter("limit");

  if ((offset && isNaN(offset)) || (offset && offset < 0))
    throw new errors.ErrorInvalidParameter("offset");

  return blocks.getBlocks(limit, offset, asc)
};

BlocksController.getLastBlock = async function() {
  return blocks.getLastBlock();
};

BlocksController.getBlocksByOrder = async function(order, limit, offset) {
  if ((limit && isNaN(limit)) || (limit && limit <= 0))
    throw new errors.ErrorInvalidParameter("limit");

  if ((offset && isNaN(offset)) || (offset && offset < 0))
    throw new errors.ErrorInvalidParameter("offset");

  return blocks.getBlocksByOrder(order, limit, offset);
};

BlocksController.getLowestHashes = async function(limit, offset) {
  if ((limit && isNaN(limit)) || (limit && limit <= 0))
    throw new errors.ErrorInvalidParameter("limit");

  if ((offset && isNaN(offset)) || (offset && offset < 0))
    throw new errors.ErrorInvalidParameter("offset");

  return blocks.getLowestHashes(limit, offset);
};

BlocksController.getBlock = async function(height) {
  if (isNaN(height))
    throw new errors.ErrorInvalidParameter("height");

  height = Math.max(parseInt(height), 0);

  const result = await blocks.getBlock(height);
  if (!result)
    throw new errors.ErrorBlockNotFound();
  
  return result;
};

BlocksController.blockToJSON = function(block) {
  return blocks.blockToJSON(block); // i needed to move it but i didnt want to change 1000 lines of code ok
};

BlocksController.submitBlock = async function(req, address, rawNonce) {
  if (!await krist.isMiningEnabled()) throw new errors.ErrorMiningDisabled();

  if (!address) throw new errors.ErrorMissingParameter("address");
  if (!krist.isValidKristAddress(address)) 
    throw new errors.ErrorInvalidParameter("address");

  if (!rawNonce) throw new errors.ErrorMissingParameter("rawNonce");
  if (rawNonce.length < 1 || rawNonce.length > constants.nonceMaxSize)
    throw new errors.ErrorInvalidParameter("nonce");

  const nonce = Array.isArray(rawNonce) ? new Uint8Array(rawNonce) : rawNonce;
  const lastBlock = await blocks.getLastBlock();

  const last = lastBlock.hash.substr(0, 12);
  const difficulty = await krist.getWork();
  const hash = utils.sha256(address, last, nonce);

  if (parseInt(hash.substr(0, 12), 16) <= difficulty || krist.freeNonceSubmission) {
    return blocks.submit(req, hash, address, nonce);
  } else {
    throw new errors.ErrorSolutionIncorrect();
  }
};

module.exports = BlocksController;
