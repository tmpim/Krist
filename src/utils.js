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

const crypto = require('crypto');
const errors = require('./errors/errors.js');
const chalk  = require("chalk");

function Utils() {}

Utils.sha256 = function(input) {
	return crypto.createHash('sha256').update(input.toString()).digest('hex');
};

Utils.hexToBase36 = function(input) {
	for (var i= 6; i <= 251; i += 7) {
		if (input <= i) {
			if (i <= 69) {
				return String.fromCharCode(('0'.charCodeAt(0)) + (i - 6) / 7);
			}

			return String.fromCharCode(('a'.charCodeAt(0)) + ((i - 76) / 7));
		}
	}

	return 'e';
};

Utils.padDigits = function(number, digits) {
	return new Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
};

Utils.errorToJSON = function(error) {
	if (error instanceof errors.KristError) {
		var out = {
			ok: false,
			error: error.errorString
		};

		if (error.message) {
			out.message = message;
		}

		if (error.info) {
			for (var key in error.info) {
				if (error.info.hasOwnProperty(key)) {
					out[key] = error.info[key];
				}
			}
		}

		return out;
	} else {
		console.error(chalk`{red [Error]} Uncaught error.`);
		console.error(error.stack);

		return {
			ok: false,
			error: 'server_error'
		};
	}
};

Utils.sendErrorToRes = function (req, res, error) {
	var errorCode = error.statusCode || 500;

	if (req.query.cc !== 'undefined') {
		errorCode = 200;
	}

	res.status(errorCode).json(Utils.errorToJSON(error));
};

Utils.sanitiseLimit = function(limit, def, max) {
	def = def || 50;
	max = max || 1000;

	if (limit === null || limit === '' || (typeof limit === 'string' && limit.trim() === '')) {
		return def;
	}

	return typeof limit !== 'undefined' && limit !== null ? Math.min(parseInt(limit) < 0 ? def : parseInt(limit), max) : def;
};

Utils.sanitiseOffset = function(offset) {
	return typeof offset !== 'undefined' ? parseInt(offset) : null;
};

Utils.sendToWS = function(ws, message) {
	ws.send(JSON.stringify(message));
};

Utils.sendErrorToWS = function(ws, error) {
	ws.send(JSON.stringify(Utils.errorToJSON(error)));
};

Utils.sendErrorToWSWithID = function(ws, id, error) {
	var e = Utils.errorToJSON(error);

	e.id = id;

	ws.send(JSON.stringify(e));
};

module.exports = Utils;
