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

const Sequelize = require("sequelize");
const constants = require("./constants.js");
const database  = require("./database.js");

const Address = database.getSequelize().define("address", {
  address: {
    type: Sequelize.STRING(10),
    unique: true
  },
  balance: Sequelize.INTEGER.UNSIGNED,
  totalin: Sequelize.INTEGER.UNSIGNED,
  totalout: Sequelize.INTEGER.UNSIGNED,
  firstseen: Sequelize.DATE,
  privatekey: {
    type: Sequelize.STRING(64),
    allowNull: true
  },
  alert: {
    type: Sequelize.STRING(1024),
    allowNull: true
  },
  locked: Sequelize.BOOLEAN
}, {
  timestamps: false
});

const Block = database.getSequelize().define("block", {
  value: Sequelize.INTEGER.UNSIGNED,
  hash: {
    type: Sequelize.STRING(64),
    unique: true
  },
  address: Sequelize.STRING(10),
  nonce: Sequelize.STRING(constants.nonceMaxSize * 2),
  time: Sequelize.DATE,
  difficulty: Sequelize.INTEGER(10).UNSIGNED,
  useragent: Sequelize.STRING(255)
}, {
  timestamps: false,
  indexes: [
    { // Index the address that mined a block
      fields: ["address"]
    }
  ]
});

const Name = database.getSequelize().define("name", {
  name: {
    type: Sequelize.STRING(64),
    unique: true
  },
  owner: Sequelize.STRING(10),
  registered: Sequelize.DATE,
  updated: Sequelize.DATE,
  a: Sequelize.STRING,
  unpaid: Sequelize.INTEGER.UNSIGNED
}, {
  timestamps: false,
  indexes: [
    { // Index on 'owner'
      fields: ["owner"]
    }
  ]
});

const Transaction = database.getSequelize().define("transaction", {
  from: Sequelize.STRING(10),
  to: Sequelize.STRING(10),
  value: Sequelize.INTEGER.UNSIGNED,
  time: Sequelize.DATE,
  name: Sequelize.STRING(128),
  op: Sequelize.STRING(512)
}, {
  timestamps: false,
  indexes: [
    { // Index on 'from'
      fields: ["from"]
    },
    { // Index on 'to'
      fields: ["to"]
    }
  ]
});

const AuthLog = database.getSequelize().define("authlog", {
  address: Sequelize.STRING(10),
  ip: Sequelize.STRING(47),
  time: Sequelize.DATE,
  type: Sequelize.ENUM("auth", "mining")
}, {
  timestamps: false,
  indexes: [
    { fields: ["address"] },
    { fields: ["address", "ip"] },
    { fields: ["time"] }
  ]
});

module.exports = {
  address: Address,
  block: Block,
  name: Name,
  transaction: Transaction,
  authLog: AuthLog,

  sync(force) {
    return Promise.all([
      Address.sync({ force }),
      Block.sync({ force }),
      Name.sync({ force }),
      Transaction.sync({ force }),
      AuthLog.sync({ force })
    ]);
  }
};
