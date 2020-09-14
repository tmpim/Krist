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

const config    = require("./../config.js");
const Sequelize = require("sequelize");
const chalk     = require("chalk");

function Database() {}

module.exports = Database;

Database.getSequelize = function() {
  return Database.sequelize;
};

Database.init = async function() {
  const requiredConfigOptions = [
    "databaseHost",
    "databaseDB",
    "databaseUser",
    "databasePass"
  ];

  requiredConfigOptions.forEach(function(option) {
    if (!config[option]) {
      console.error(chalk`{red [Config]} Missing config option: ${option}`);

      process.exit(1);
    }
  });

  console.log(chalk`{cyan [DB]} Connecting to database {bold ${config.databaseDB}} as user {bold ${config.databaseUser}}...`);

  Database.sequelize = new Sequelize(config.databaseDB, config.databaseUser, config.databasePass, {
    host: config.databaseHost,
    dialect: config.databaseDialect,
    logging: false,
    pool: {
      max: 6,
      min: 2,
      idle: 10000
    }
  });

  try {
    Database.sequelize.authenticate();
    console.log(chalk`{green [DB]} Connected`);
  } catch (error) {
    console.error(error);
  }
};
