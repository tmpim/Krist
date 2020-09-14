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

const config        = require("./../config.js");
const utils         = require("./utils.js");
const errors        = require("./errors/errors.js");
const express       = require("express");
const bodyParser    = require("body-parser");
const expressWs     = require("express-ws");
const swig          = require("swig");
const rateLimit     = require("express-rate-limit");
const gitlog        = require("gitlog");
const fs            = require("fs");
const path          = require("path");
const chalk         = require("chalk");
const { promisify } = require("util");

function Webserver() {}

module.exports = Webserver;

Webserver.getExpress = function() {
  return Webserver.express;
};

Webserver.init = async function() {
  if (typeof config.serverSock === "undefined") {
    console.error(chalk`{red [Config]} Missing config option: serverSock`);

    return null;
  }

  Webserver.express = express();
  Webserver.ws = expressWs(Webserver.express);

  Webserver.express.enable("trust proxy");
  Webserver.express.disable("x-powered-by");
  Webserver.express.disable("etag");

  Webserver.express.use(function(req, res, next) {
    delete req.headers["content-encoding"];
    next();
  });

  Webserver.express.use(express.static("static"));

  Webserver.express.set("views", path.join(__dirname, "../views"));
  Webserver.express.set("view engine", "swig");
  Webserver.express.engine(".swig", swig.renderFile);

  swig.setDefaults({
    debug: config.debugMode
  });

  Webserver.express.use(bodyParser.urlencoded({ extended: false }));
  Webserver.express.use(bodyParser.json());

  Webserver.express.use(rateLimit(config.rateLimitSettings));

  Webserver.express.all("*", function(req, res, next) {
    res.header("X-Robots-Tag", "none");
    res.header("Content-Type", "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, UPDATE, DELETE, OPTIONS");
    next();
  });

  Webserver.express.all("/", function(req, res, next) {
    res.header("Content-Type", "text/plain");
    next();
  });

  console.log(chalk`{cyan [Webserver]} Loading routes`);

  try {
    const routePath = path.join(__dirname, "routes");

    fs.readdirSync(routePath).forEach(function(file) {
      if (path.extname(file).toLowerCase() !== ".js") {
        return;
      }

      try {
        require("./routes/" + file)(Webserver.express);
      } catch (error) {
        console.error(chalk`{red [Webserver]} Error loading route '${file}':`);
        console.error(error.stack);
      }
    });
  } catch (error) {
    console.error(chalk`{red [Webserver]} Error finding routes:`);
    console.error(error.stack);
  }

  Webserver.express.get("/", function(req, res) {
    res.header("Content-Type", "text/html");

    gitlog({
      repo: path.join(__dirname, "../"),
      number: 10,
      fields: [
        "subject",
        "body",
        "hash",
        "authorName",
        "authorDateRel"
      ]
    }, function(error, commits) {
      if (error) {
        console.log(error);

        return res.render("error", {
          protocol: req.protocol
        });
      }

      res.render("index", {
        commits: commits,
        protocol: req.protocol
      });
    });
  });

  Webserver.express.use(function(req, res) {
    if (req.accepts("html")) { // Respond to browsers with HTML 404 page
      res.header("Content-Type", "text/html");
      res.render("error_404", {
        protocol: req.protocol
      });
    } else { // Respond to API requests with JSON 404 response
      utils.sendErrorToRes(req, res, new errors.ErrorRouteNotFound());
    }
  });

  await promisify(Webserver.express.listen)(config.serverSock);
  console.log(chalk`{green [Webserver]} Listening on {bold ${config.serverSock}}`);
};
