/*
 * Copyright 2016 - 2022 Drew Edwards, tmpim
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

import { Router } from "express";
import { getDetailedMotd } from "../../krist/motd";

export default (): Router => {
  const router = Router();

  /**
	 * @api {get} /motd Get the message of the day
	 * @apiName GetMOTD
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.6.4
	 *
	 * @apiSuccess {String} motd The message of the day
	 * @apiSuccess {Date} set The date the MOTD was last changed (provided for
   *   backwards compatibility)
	 * @apiSuccess {Date} motd_set The date the MOTD was last changed (ISO-8601)
	 * @apiSuccess {Date} server_time The current server time (ISO-8601)
   *
	 * @apiSuccess {String} public_url The public URL of this Krist node.
	 * @apiSuccess {Boolean} mining_enabled If mining is enabled on the server,
   *    this will be set to 'true'.
	 * @apiSuccess {Boolean} debug_mode If the server is running in debug mode,
   *    this will be set to 'true'.
   *
	 * @apiSuccess {Number} work The current Krist work (difficulty).
	 * @apiSuccess {Object} last_block The last block mined on the Krist node.
   *   May be `null`.
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
   *   "server_time": "2021-02-24T08:11:22.628Z",
   *   "motd": "Welcome to Krist!",
   *   "set": "2021-02-12T10:02:34.000Z",
   *   "motd_set": "2021-02-12T10:02:34.000Z",
   *   "public_url": "localhost:8080",
   *   "mining_enabled": true,
   *   "debug_mode": true,
   *   "work": 100000,
   *   "last_block": {
   *     "height": 2,
   *     "address": "k8juvewcui",
   *     "hash": "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
   *     "short_hash": "000000012697",
   *     "value": 29,
   *     "time": "2021-02-21T05:11:05.000Z",
   *     "difficulty": 400000000000
   *   },
   *   "package": {
   *     "name": "krist",
   *     "version": "2.6.4",
   *     "author": "Lemmmy",
   *     "licence": "GPL-3.0",
   *     "repository": "https://github.com/tmpim/Krist"
   *   },
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
   *   },
   *   "notice": "Krist was originally created by 3d6 and Lemmmy. It is now owned and operated by tmpim, and licensed under GPL-3.0."
   * }
	 */
  router.all("/motd", async (req, res) => {
    // Stringify to prettify output
    res.header("Content-Type", "application/json");
    return res.send(JSON.stringify({
      ok: true,
      ...await getDetailedMotd()
    }, null, 2));
  });

  return router;
};
