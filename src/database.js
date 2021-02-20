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
const chalk     = require("chalk");

function Database() {}

module.exports = Database;

Database.getSequelize = function() {
  return Database.sequelize;
};

Database.init = async function() {
  const isTest = process.env.NODE_ENV === "test";

  const host = process.env.DB_HOST || "127.0.0.1";
  const port = parseInt(process.env.DB_PORT) || 3306;
  const db = isTest ? (process.env.TEST_DB_NAME || "test_krist") : (process.env.DB_NAME || "krist");
  const user = isTest ? (process.env.TEST_DB_USER || "test_krist") : (process.env.DB_USER || "krist");
  const pass = isTest ? process.env.TEST_DB_PASS : process.env.DB_PASS;

  console.log(chalk`{cyan [DB]} Connecting to database {bold ${db}} as user {bold ${user}}...`);

  Database.sequelize = new Sequelize(db, user, pass, {
    host,
    port,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 6,
      min: 2,
      idle: 10000
    }
  });

  try {
    await Database.sequelize.authenticate();
    console.log(chalk`{green [DB]} Connected`);
  } catch (error) {
    console.error(error);
  }
};
