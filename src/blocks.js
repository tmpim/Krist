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

function Blocks() {}
module.exports = Blocks;

const utils      = require("./utils.js");
const krist      = require("./krist.js");
const websockets = require("./websockets.js");
const schemas    = require("./schemas.js");
const addresses  = require("./addresses.js");
const names      = require("./names.js");
const tx         = require("./transactions.js");
const moment     = require("moment");
const Database   = require("./database.js");
const chalk      = require("chalk");
const { Op }     = require("sequelize");

const promClient = require("prom-client");
const promBlockCounter = new promClient.Counter({
  name: "krist_blocks_total",
  help: "Total number of blocks since the Krist server started."
});

Blocks.getBlock = function(id) {
  return schemas.block.findByPk(id);
};

Blocks.getBlocks = function(limit, offset, asc) {
  return schemas.block.findAndCountAll({order: [["id", asc ? "ASC" : "DESC"]],  limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getBlocksByOrder = function(order, limit, offset) {
  return schemas.block.findAndCountAll({order: order, limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getLastBlock = function(t) {
  return schemas.block.findOne({order: [["id","DESC"]]}, { transaction: t });
};

Blocks.getLowestHashes = function(limit, offset) {
  return schemas.block.findAndCountAll({
    where: {
      [Op.and]: [
        { hash: { [Op.not]: null } },
        { id: { [Op.gt]: 10 } } // Ignore the genesis block
      ]
    },
    order: [["hash", "ASC"]], 
    limit: utils.sanitiseLimit(limit), 
    offset: utils.sanitiseOffset(offset)
  });
};

Blocks.lookupBlocks = function(limit, offset, orderBy, order) {
  return schemas.block.findAndCountAll({
    order: [[orderBy || "id", order || "ASC"]],
    limit: utils.sanitiseLimit(limit),
    offset: utils.sanitiseOffset(offset),
  });
};

Blocks.getLegacyWork = function(blockID) {
  // Early return for all existing blocks
  if (blockID >= 5000) return null;

  if (blockID >= 1 && blockID < 501) return 400000000000;
  if (blockID >= 501 && blockID < 541) return 381274937337;
  if (blockID >= 541 && blockID < 546) return 350000000000;
  if (blockID >= 546 && blockID < 549) return 400000000000;
  if (blockID >= 549 && blockID < 554) return 300000000000;
  if (blockID >= 554 && blockID < 635) return 288365888229;
  if (blockID >= 635 && blockID < 891) return 58365888229;
  if (blockID >= 891 && blockID < 936) return 6000000000;
  if (blockID >= 936 && blockID < 974) return 400000000000;
  if (blockID >= 974 && blockID < 979) return 100000000000;
  if (blockID >= 979 && blockID < 1083) return 400000000000;
  if (blockID >= 1083 && blockID < 1149) return 100000000000;
  if (blockID >= 1149 && blockID < 1165) return 10000000000;
  if (blockID >= 1165 && blockID < 1171) return 5000000000;
  if (blockID >= 1171 && blockID < 1172) return 500000000;
  if (blockID >= 1172 && blockID < 1178) return 5000000000;
  if (blockID >= 1178 && blockID < 1355) return 2000000000000;
  if (blockID >= 1355 && blockID < 1390) return 200000000000;
  if (blockID >= 1390 && blockID < 2486) return 20000000000;
  if (blockID >= 2486 && blockID < 2640) return 400000000000;
  if (blockID >= 2640 && blockID < 2667) return 300000000000;
  if (blockID >= 2667 && blockID < 2700) return 3000000000;
  if (blockID >= 2700 && blockID < 2743) return 10000000000;
  if (blockID >= 2743 && blockID < 2773) return 8000000000;
  if (blockID >= 2773 && blockID < 2795) return 5000000000;
  if (blockID >= 2795 && blockID < 2812) return 3000000000;
  if (blockID >= 2812 && blockID < 2813) return 1000000000;
  if (blockID >= 2813 && blockID < 2936) return 400000000000;
  if (blockID >= 2936 && blockID < 2942) return 4000000000;
  if (blockID >= 2942 && blockID < 2972) return 8000000000;
  if (blockID >= 2972 && blockID < 2989) return 2000000000;
  if (blockID >= 2989 && blockID < 2990) return 100000000;
  if (blockID >= 2990 && blockID < 2998) return 500000000;
  if (blockID >= 2998 && blockID < 3000) return 200000000;
  if (blockID >= 3000 && blockID < 3003) return 100000000;
  if (blockID >= 3003 && blockID < 3005) return 50000000;
  if (blockID >= 3005 && blockID < 3006) return 23555120;
  if (blockID >= 3006 && blockID < 3018) return 53555120;
  if (blockID >= 3018 && blockID < 3029) return 20000000;
  if (blockID >= 3029 && blockID < 3089) return 400000000000;
  if (blockID >= 3089 && blockID < 3096) return 20000000;
  if (blockID >= 3096 && blockID < 3368) return 19875024;
  if (blockID >= 3368 && blockID < 4097) return 10875024;
  if (blockID >= 4097 && blockID < 5000) return 8750240;
};

Blocks.getBaseBlockValue = function(blockID) {
  return blockID >= 222222 ? 1 : (blockID >= 100000 ? 12 : 25);
};

Blocks.getBlockValue = async (t) => {
  const lastBlock = await Blocks.getLastBlock(t);
  const unpaidNames = await names.getUnpaidNameCount(t);
  return Blocks.getBaseBlockValue(lastBlock.id) + unpaidNames;
};

Blocks.submit = async function(req, hash, address, nonce) {
  const { logDetails } = utils.getLogDetails(req);
  addresses.logAuth(req, address, "mining");

  const { block, newWork } = await Database.getSequelize().transaction(async t => {
    const lastBlock = await Blocks.getLastBlock(t);
    const value = await Blocks.getBlockValue();
    const time = new Date();

    const oldWork = await krist.getWork();

    const seconds = (time - lastBlock.time) / 1000;
    const targetWork = seconds * oldWork / krist.getSecondsPerBlock();
    const diff = targetWork - oldWork;

    // eslint is wrong lmao
    // eslint-disable-next-line no-shadow
    const newWork = Math.round(Math.max(Math.min(oldWork + diff * krist.getWorkFactor(), krist.getMaxWork()), krist.getMinWork()));

    console.log(chalk`{bold [Krist]} Submitting {bold ${value} KST} block by {bold ${address}} at {cyan ${moment().format("HH:mm:ss DD/MM/YYYY")}} ${logDetails}`);
    promBlockCounter.inc();

    const unpaidNames = await schemas.name.findAll({ 
      where: { 
        unpaid: { [Op.gt]: 0 }
      }
    }, { transaction: t });

    // Do all the fun stuff in parallel
    // eslint-disable-next-line no-shadow
    const [block] = await Promise.all([
      // Create the new block
      schemas.block.create({
        hash: hash,
        address: address,
        // Convert a binary nonce to a string if necessary
        nonce: Buffer.from(nonce, "binary").toString("hex"),
        time: time,
        difficulty: oldWork,
        value: value
      }, { transaction: t }),

      // Create the transaction
      tx.createTransaction(address, null, value, null, null, t),

      // Decrement all unpaid name counters
      unpaidNames.map(name => name.decrement({ unpaid: 1 }, { transaction: t }))
    ]);

    // See if the address already exists before depositing Krist to it
    const kristAddress = await addresses.getAddress(address);
    if (kristAddress) { // Address exists, increment its balance
      await kristAddress.increment({ balance: value, totalin: value }, { transaction: t });
    } else { // Address doesn't exist, create it
      await schemas.address.create({
        address,
        firstseen: time,
        balance: value,
        totalin: value,
        totalout: 0
      }, { transaction: t });
    }

    return { block, newWork };
  });

  // Get the updated address balance to return to the API
  const kristAddress = await addresses.getAddress(address);

  // Save the new work
  console.log(chalk`        New work: {green ${newWork.toLocaleString()}} New balance: {green ${kristAddress.balance}}`);
  await krist.setWork(newWork);

  // Submit the new block event to all websockets (async)
  websockets.broadcastEvent({
    type: "event",
    event: "block",
    block: Blocks.blockToJSON(block),
    new_work: newWork
  }, function(ws) {
    // Only send if they are subscribed to `ownBlocks` (when authed), or 
    // subscribed to `blocks`
    return new Promise(function(resolve, reject) {
      if ((!ws.isGuest && ws.auth === address && ws.subscriptionLevel.indexOf("ownBlocks") >= 0) || ws.subscriptionLevel.indexOf("blocks") >= 0) {
        return resolve();
      }

      reject();
    });
  });

  return { work: newWork, address: kristAddress, block };
};

Blocks.blockToJSON = function(block) {
  return {
    height: block.id,
    address: block.address,
    hash: block.hash,
    short_hash: block.hash ? block.hash.substring(0, 12) : null,
    value: block.value,
    time: block.time,
    difficulty: Blocks.getLegacyWork(block.id) || block.difficulty
  };
};
