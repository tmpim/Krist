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

const utils         = require("./utils.js");
const errors        = require("./errors/errors.js");
const express       = require("express");
const bodyParser    = require("body-parser");
const expressWs     = require("express-ws");
const exphbs        = require("express-handlebars");
const rateLimit     = require("express-rate-limit");
const cors          = require("cors");
const fs            = require("fs");
const path          = require("path");
const chalk         = require("chalk");
const prometheus    = require("./prometheus");

function Webserver() {}

module.exports = Webserver;

Webserver.getExpress = function() {
  return Webserver.express;
};

Webserver.init = async function() {
  const app = Webserver.express = express();
  Webserver.ws = expressWs(app);

  app.enable("trust proxy");
  app.disable("x-powered-by");
  app.disable("etag");

  prometheus.init(app);

  app.use(cors());

  app.use(function(req, res, next) {
    delete req.headers["content-encoding"];
    next();
  });

  app.use(express.static("static"));

  app.engine(".hbs", exphbs({
    extname: ".hbs",
    helpers: {
      concat(str, suffix) {
        if (typeof str === "string" && typeof suffix === "string")
          return str + suffix;
        return str;
      }
    }
  }));
  app.set("view engine", ".hbs");
  app.locals.debug = process.env.NODE_ENV !== "production";

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  if (process.env.NODE_ENV !== "test") {
    app.use(rateLimit({
      windowMs: 60000,
      delayAfter: 240,
      delayMs: 5,
      max: 320,
      message: "Rate limit hit. Please try again later."
    }));
  }

  app.all("*", function(req, res, next) {
    res.header("X-Robots-Tag", "none");
    res.header("Content-Type", "application/json");
    next();
  });

  app.all("/", function(req, res, next) {
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
        require("./routes/" + file)(app);
      } catch (error) {
        console.error(chalk`{red [Webserver]} Error loading route '${file}':`);
        console.error(error.stack);
      }
    });
  } catch (error) {
    console.error(chalk`{red [Webserver]} Error finding routes:`);
    console.error(error.stack);
  }

  app.use(function(req, res) {
    if (req.accepts("html")) { // Respond to browsers with HTML 404 page
      res.header("Content-Type", "text/html");
      res.render("error_404");
    } else { // Respond to API requests with JSON 404 response
      utils.sendErrorToRes(req, res, new errors.ErrorRouteNotFound());
    }
  });

  const listen = parseInt(process.env.WEB_LISTEN) || 8080;
  await new Promise((resolve, reject) => {
    const server = Webserver.server = app.listen(listen, () => {
      console.log(chalk`{green [Webserver]} Listening on {bold ${listen}}`);
      resolve(Webserver.server);
    });

    server.on("error", reject);
  });
};
