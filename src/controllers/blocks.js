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

const config = require("./../../config.js");
const blocks = require("./../blocks.js");
const krist  = require("./../krist.js");
const utils  = require("./../utils.js");
const errors = require("./../errors/errors.js");

function BlocksController() {}

BlocksController.getBlocks = function(limit, offset, asc) {
  return new Promise(function(resolve, reject) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
      return reject(new errors.ErrorInvalidParameter("limit"));
    }

    if ((offset && isNaN(offset)) || (offset && offset < 0)) {
      return reject(new errors.ErrorInvalidParameter("offset"));
    }

    blocks.getBlocks(limit, offset, asc).then(resolve).catch(reject);
  });
};

BlocksController.getLastBlock = function() {
  return new Promise(function(resolve, reject) {
    blocks.getLastBlock().then(resolve).catch(reject);
  });
};

BlocksController.getBlocksByOrder = function(order, limit, offset) {
  return new Promise(function(resolve, reject) {
    if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
      return reject(new errors.ErrorInvalidParameter("limit"));
    }

    if ((offset && isNaN(offset)) || (offset && offset < 0)) {
      return reject(new errors.ErrorInvalidParameter("offset"));
    }

    blocks.getBlocksByOrder(order, limit, offset).then(resolve).catch(reject);
  });
};

BlocksController.getBlock = function(height) {
  return new Promise(function(resolve, reject) {
    if (isNaN(height)) {
      return reject(new errors.ErrorInvalidParameter("height"));
    }

    height = Math.max(parseInt(height), 0);

    blocks.getBlock(height).then(function(result) {
      if (!result) {
        return reject(new errors.ErrorBlockNotFound());
      }

      resolve(result);
    }).catch(reject);
  });
};

BlocksController.blockToJSON = function(block) {
  return blocks.blockToJSON(block); // i needed to move it but i didnt want to change 1000 lines of code ok
};

BlocksController.submitBlock = function(address, nonce) {
  return new Promise(function(resolve, reject) {
    if (!address) {
      return reject(new errors.ErrorMissingParameter("address"));
    }

    if (!krist.isValidKristAddress(address)) {
      return reject(new errors.ErrorInvalidParameter("address"));
    }

    if (!nonce) {
      return reject(new errors.ErrorMissingParameter("nonce"));
    }

    if (nonce.length < 1 || nonce.length > config.nonceMaxSize) {
      return reject(new errors.ErrorInvalidParameter("nonce"));
    }

    const nonce = Array.isArray(nonce) ? new Uint8Array(nonce) : nonce;
    blocks.getLastBlock().then(function(lastBlock) {
      const last = lastBlock.hash.substr(0, 12);
      const difficulty = krist.getWork();
      const hash = utils.sha256(address, last, nonce);

      if (parseInt(hash.substr(0, 12), 16) <= difficulty || krist.freeNonceSubmission) {
        blocks.submit(hash, address, nonce).then(resolve).catch(reject);
      } else {
        return reject(new errors.ErrorSolutionIncorrect());
      }
    }).catch(reject);
  });
};

module.exports = BlocksController;
