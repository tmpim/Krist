// Import things in the same order the Krist server would
require("dotenv").config();

const chai     = require("chai");
const chaiHttp = require("chai-http");
const sinon    = require("sinon");

const chalk = require("chalk");

const database   = require("../src/database.js");
const redis      = require("../src/redis.js");
const webserver  = require("../src/webserver.js");

exports.mochaGlobalSetup = async function() {
  chai.use(chaiHttp);

  redis.init();
  await database.init();
  await webserver.init();

  await require("../src/krist.js").init();
};

exports.mochaGlobalTeardown = async function() {
  console.log(chalk`{red [Tests]} Stopping web server and database`);

  webserver.server.close();
  await database.getSequelize().close();

  // Clear timers (require here to avoid circular dependency issues)
  clearInterval(require("../src/krist.js").workOverTimeInterval);
  clearInterval(require("../src/websockets.js").keepaliveInterval);
};

exports.mochaHooks = {
  beforeEach(done) {
    // Suppress Krist's rather verbose logging during tests
    if (!process.env.TEST_DEBUG) sinon.stub(console, "log");
    done();
  },
  
  afterEach(done) {
    if (!process.env.TEST_DEBUG) console.log.restore();
    done();
  }
};
