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
const { Op }     = require("sequelize");

function Names() {}

Names.getNames = function(limit, offset) {
  return schemas.name.findAndCountAll({order: [["name", "ASC"]], limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Names.getNamesByAddress = function(address, limit, offset) {
  return schemas.name.findAndCountAll({order: [["name", "ASC"]], where: {owner: address}, limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Names.getNameCountByAddress = function(address) {
  return schemas.name.count({where: {owner: address}});
};

Names.getNameByName = function(name) {
  return schemas.name.findOne({where: {name: name}});
};

Names.getUnpaidNames = function(limit, offset) {
  return schemas.name.findAndCountAll({order: [["id", "DESC"]], where: {unpaid: {[Op.gt]: 0}},  limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Names.getUnpaidNameCount = function(t) {
  return schemas.name.count({where: {unpaid: {[Op.gt]: 0}}}, { transaction: t });
};

Names.getNameCost = function() {
  return config.nameCost;
};

Names.createName = async function(name, owner) {
  const dbName = await schemas.name.create({
    name,
    owner,
    registered: new Date(),
    updated: new Date(),
    unpaid: Names.getNameCost()
  });
  
  websockets.broadcastEvent({
    type: "event",
    event: "name",
    name: Names.nameToJSON(dbName)
  }, function(ws) {
    return new Promise(function(resolve, reject) {
      if ((!ws.isGuest && (ws.auth === owner) && ws.subscriptionLevel.indexOf("ownNames") >= 0) || ws.subscriptionLevel.indexOf("names") >= 0) {
        return resolve();
      }

      reject();
    });
  });

  return dbName;
};

Names.nameToJSON = function(name) {
  return {
    name: name.name,
    owner: name.owner,
    registered: name.registered,
    updated: name.updated,
    a: name.a
  };
};

module.exports = Names;
