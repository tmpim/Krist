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

const crypto   = require("crypto");
const errors   = require("./errors/errors.js");
const chalk    = require("chalk");
const database = require("./database");

function Utils() {}

Utils.sha256 = function(...inputs) {
  let hash = crypto.createHash("sha256");
  for (const input of inputs) {
    hash = hash.update(input instanceof Uint8Array ? input : input.toString());
  }
  return hash.digest("hex");
};

Utils.hexToBase36 = function(input) {
  for (let i= 6; i <= 251; i += 7) {
    if (input <= i) {
      if (i <= 69) {
        return String.fromCharCode(("0".charCodeAt(0)) + (i - 6) / 7);
      }

      return String.fromCharCode(("a".charCodeAt(0)) + ((i - 76) / 7));
    }
  }

  return "e";
};

Utils.padDigits = function(number, digits) {
  return new Array(Math.max(digits - String(number).length + 1, 0)).join("0") + number;
};

Utils.errorToJSON = function(error) {
  if (error instanceof errors.KristError) {
    return {
      ok: false,
      error: error.errorString,
      message: error.message,
      ...(error.info || {})
    };
  } else if (error.name === "SequelizeUniqueConstraintError") {
    console.error(chalk`{red [Error]} Uncaught validation error.`);
    console.error(error.stack);
    console.error(error.errors);

    return {
      ok: false,
      error: "server_error"
    };
  } else {
    console.error(chalk`{red [Error]} Uncaught error.`);
    console.error(error.stack);

    return {
      ok: false,
      error: "server_error"
    };
  }
};

Utils.sendErrorToRes = function (req, res, error) {
  let errorCode = error.statusCode || 500;

  if (req.query.cc !== "undefined") {
    errorCode = 200;
  }

  res.status(errorCode).json(Utils.errorToJSON(error));
};

Utils.sanitiseLimit = function(limit, def, max) {
  def = def || 50;
  max = max || 1000;

  if (
    typeof limit === "undefined"
    || limit === null
    || limit === ""
    || (typeof limit === "string" && limit.trim() === "")
    || isNaN(parseInt(limit))
  ) {
    return def;
  }

  return Math.min(
    parseInt(limit) < 0 ? def : parseInt(limit),
    max
  );
};

Utils.sanitiseOffset = function(offset) {
  return typeof offset !== "undefined" ? parseInt(offset) : null;
};

Utils.sanitiseLike = function(query) {
  if (!query || typeof query !== "string")
    throw new Error("invalid like");

  const sequelize = database.getSequelize();

  const inputRaw = query.replace(/([_%\\])/g, "\\$1");
  const inputEscaped = sequelize.escape(`%${inputRaw}%`);
  return sequelize.literal(inputEscaped);
};

Utils.sanitiseUserAgent = function(userAgent) {
  if (!userAgent || typeof userAgent !== "string") return;
  if (userAgent.length > 255) return userAgent.substr(0, 255);
  return userAgent;
};
Utils.sanitiseOrigin = Utils.sanitiseUserAgent;

Utils.sendToWS = function(ws, message) {
  ws.send(JSON.stringify(message));
};

Utils.sendErrorToWS = function(ws, error) {
  const e = Utils.errorToJSON(error);
  e.type = "error";
  ws.send(JSON.stringify(e));
};

Utils.sendErrorToWSWithID = function(ws, id, error) {
  const e = Utils.errorToJSON(error);
  e.id = id;
  e.type = "error";
  ws.send(JSON.stringify(e));
};

Utils.getLogDetails = function(req) {
  const ip = req.ip;
  const { userAgent, origin } = Utils.getReqDetails(req);
  const path = req.path && req.path.startsWith("/.websocket//") ? "WS" : req.path;
  const logDetails = chalk`(ip: {bold ${ip}} origin: {bold ${origin}} useragent: {bold ${userAgent}})`;

  return { ip, origin, userAgent, path, logDetails };
};

Utils.getReqDetails = function(req) {
  if (!req) return { userAgent: undefined, origin: undefined };

  const userAgent = Utils.sanitiseUserAgent(req.header("User-Agent"));
  const origin = Utils.sanitiseOrigin(req.header("Origin"));
  return { userAgent, origin };
};

module.exports = Utils;
