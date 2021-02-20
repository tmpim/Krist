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

const chalk = require("chalk");
const { createNodeRedisClient } = require("handy-redis");

let redis;

module.exports = {
  getRedis() {
    return redis;  
  },

  init() {
    const isTest = process.env.NODE_ENV === "test";

    const host = process.env.REDIS_HOST || "127.0.0.1";
    const port = parseInt(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;
    const prefix = isTest ? (process.env.TEST_REDIS_PREFIX || "test_krist:") : (process.env.REDIS_PREFIX || "krist:");
    
    console.log(chalk`{cyan [Redis]} Connecting to redis`);
    redis = createNodeRedisClient({
      host,
      port,
      password,
      prefix
    });
    console.log(chalk`{green [Redis]} Connected`);
  }
};
