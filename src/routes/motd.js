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

const package = require("./../../package.json");
const krist = require("./../krist.js");
const constants = require("./../constants.js");

module.exports = function(app) {
  /**
	 * @api {get} /motd Get the message of the day
	 * @apiName GetMOTD
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiSuccess {String} motd The message of the day
	 * @apiSuccess {Date} set The date the MOTD was last changed
   * 
	 * @apiSuccess {String} public_url The public URL of this Krist node.
	 * @apiSuccess {Boolean} mining_enabled If mining is enabled on the server,
   *    this will be set to 'true'.
	 * @apiSuccess {Boolean} debug_mode If the server is running in debug mode,
   *    this will be set to 'true'.
   * 
	 * @apiSuccess {Object} package Information related to this build of the Krist
   *    source code.
	 * @apiSuccess {String} package.name The name of the package (always `krist`).
	 * @apiSuccess {String} package.version The version of the Krist server.
	 * @apiSuccess {String} package.author The author of the Krist server (always
   *    `Lemmmy`)
	 * @apiSuccess {String} package.license The license of the Krist server
   *    (always `GPL-3.0`)
	 * @apiSuccess {String} package.repository The repository of the Krist server
   *    source code.
   * 
	 * @apiSuccess {Object} constants Constants related to the Krist server
   *    configuration.
   * @apiSuccess {Number} constants.wallet_version The latest version of
   *    KristWallet.
   * @apiSuccess {Number} constants.nonce_max_size The maximum size, in bytes,
   *    of a block nonce.
   * @apiSuccess {Number} constants.name_cost The cost, in KST, of purchasing
   *    a new name.
   * @apiSuccess {Number} constants.min_work The minimum work (block difficulty)
   *    value. The work will not automatically go below this.
   * @apiSuccess {Number} constants.max_work The maximum work (block difficulty)
   *    value. The work will not automatically go above this.
   * @apiSuccess {Number} constants.work_factor Work adjustment rate per block, 
   *    where 1 means immediate adjustment to target work and 0 means constant 
   *    work.
   * @apiSuccess {Number} constants.seconds_per_block The ideal time between
   *    mined blocks. The Krist server will adjust the difficulty to match this
   *    value.
   * 
	 * @apiSuccess {Object} currency Constants related to the currency that this
   *    server represents.
   * @apiSuccess {String} currency.address_prefix The character that each
   *    address starts with (e.g. `k`).
   * @apiSuccess {String} currency.name_suffix The suffix that each name ends
   *    with after the dot (e.g. `kst`)
   * @apiSuccess {String} currency.currency_name The full long name of this
   *    currency (e.g. `Krist`).
   * @apiSuccess {String} currency.currency_symbol The shorthand symbol for this
   *    currency (e.g. `KST`).
   * 
   * @apiSuccess {String} notice Required copyright notice for the Krist server.
	 *
	 * @apiSuccessExample {json} Success
   * {
   *   "ok": true,
   *   "motd": null,
   *   "set": "2021-01-01T00:00:00.000Z",
   *   "debug_mode": true,
   *   "constants": {
   *     "wallet_version": 16,
   *     "nonce_max_size": 24,
   *     "name_cost": 500,
   *     "min_work": 100,
   *     "max_work": 100000,
   *     "work_factor": 0.025,
   *     "seconds_per_block": 60
   *   },
   *   "currency": {
   *     "address_prefix": "k",
   *     "name_suffix": "kst",
   *     "currency_name": "Krist",
   *     "currency_symbol": "KST"
   *   }
   * }
	 */
  app.all("/motd", async function(req, res) {
    const { motd, motd_set, debug_mode } = await krist.getMOTD();

    res.header("Content-Type", "application/json");
    return res.send(JSON.stringify({
      ok: true,

      motd,
      set: motd_set,

      public_url: process.env.PUBLIC_URL || "localhost:8080",
      mining_enabled: await krist.isMiningEnabled(),
      debug_mode,

      package: {
        name: package.name,
        version: package.version,
        author: package.author,
        licence: package.license,
        repository: package.repository.url
      },

      constants: {
        wallet_version: constants.walletVersion,
        nonce_max_size: constants.nonceMaxSize,
        name_cost: constants.nameCost,
        min_work: constants.minWork,
        max_work: constants.maxWork,
        work_factor: constants.workFactor,
        seconds_per_block: constants.secondsPerBlock
      },

      currency: {
        address_prefix: "k",
        name_suffix: "kst",
  
        currency_name: "Krist",
        currency_symbol: "KST"
      },
      
      // NOTE: It is against the license to modify this string on a fork node
      notice: "Krist was originally created by 3d6 and Lemmmy. It is now owned"
            + " and operated by tmpim, and licensed under GPL-3.0."
    }, null, 2));
  });

  return app;
};
