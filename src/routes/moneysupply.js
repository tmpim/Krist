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

const krist = require('./../krist.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.getmoneysupply !== 'undefined') {
			krist.getMoneySupply().then(function(supply) {
				res.send(supply);
			});

			return;
		}

		next();
	});

	/**
	 * @api {get} /supply Get the money supply
	 * @apiName GetMoneySupply
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiDescription Returns the amount of Krist currently in circulation.
	 *
	 * @apiSuccess {Number} money_supply The amount of Krist in circulation.
	 *
	 * @apiSuccessExample {json} Success
	 * {
     *     "ok": true,
     *     "money_supply": 1013359534
     * }
	 */
	app.get('/supply', async function(req, res) {
    const supply = await krist.getMoneySupply();

    res.json({
      ok: true,
      money_supply: supply
    });
	});

	return app;
};
