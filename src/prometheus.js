// no-op if disabled
if (process.env.USE_PROMETHEUS !== "true") {
  return module.exports = { init() {} };
}

const chalk     = require("chalk");
const basicAuth = require("express-basic-auth");
const client    = require("prom-client");
client.collectDefaultMetrics();

const up = new client.Gauge({
  name: "krist_up",
  help: "Whether or not the Krist server is running."
});
up.set(1);

const debug = new client.Gauge({
  name: "krist_debug",
  help: "Whether or not the Krist server is in debug mode."
});
debug.set(process.env.NODE_ENV !== "production");

module.exports = {
  init(app) {
    // protect the metrics endpoint if a password was specified
    const password = process.env.PROMETHEUS_PASSWORD;
    if (password) {
      app.use("/metrics", basicAuth({
        users: { "prometheus": password },

        unauthorizedResponse(req) {
          console.log(chalk`{red [Webserver]} Unauthorized access on Prometheus endpoint from {bold ${req.ip}}!`);
          return "";
        }
      }));
    }

    app.use("/metrics", async (req, res) => {
      try {
        res.set("Content-Type", client.register.contentType);
        res.end(await client.register.metrics());
      } catch (err) {
        res.status(500).end(err);
      }
    });
    
    console.log(chalk`{cyan [Webserver]} Prometheus is enabled!`);
  }
};
