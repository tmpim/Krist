const chalk = require("chalk");
const redis = require("../src/redis");

module.exports = {
  async seed() {
    // Must require schemas here because of circular dependencies
    const database = require("../src/database");
    const schemas = require("../src/schemas");

    const debug = !!process.env.TEST_DEBUG;

    const sq = database.getSequelize();

    // Cowardly refuse to wipe the databases if the database name is 'krist'
    // (production username)
    if (sq.getDatabaseName() === "krist")
      throw new Error("Refusing to wipe production databases in test runner. Check environment variables!!");

    // Clear the databases
    if (debug) console.log(chalk`{red [Tests]} Clearing the database {bold ${sq.getDatabaseName()}}`);
    await sq.sync({ force: true });

    if (debug) console.log(chalk`{red [Tests]} Seeding the database {bold ${sq.getDatabaseName()}}`);
    await Promise.all([
      // Create the genesis block
      schemas.block.create({
        value: 50,
        hash: "0000000000000000000000000000000000000000000000000000000000000000",
        address: "0000000000",
        nonce: 0,
        difficulty: 4294967295,
        time: new Date()
      }),

      // Create some addresses to test with
      schemas.address.bulkCreate([
        { address: "k8juvewcui", balance: 10, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "a350fa569fc53804c4282afbebafeba973c33238704815ea41fa8eec1f13a791" },
        { address: "k7oax47quv", balance: 0, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "1f71334443b70c5c384894bc6308e9fcfb5b3103abb82eba6cd26d7767b5740c" },
        { address: "kwsgj3x184", balance: 0, totalin: 0, totalout: 0, firstseen: new Date(), privatekey: "75185375f6e1e0eecbbe875355de2e38b7e548efbc80985479f5870967dcd2df", alert: "Test alert", locked: true },
      ])
    ]);

    // Reset the Redis database
    const r = redis.getRedis();
    const redisPrefix = process.env.TEST_REDIS_PREFIX || "test_krist:";
    const redisKeys = await r.keys(redisPrefix + "*");

    if (debug) console.log(chalk`{red [Tests]} Clearing {bold ${redisKeys.length}} redis keys with prefix {bold ${redisPrefix}}`);
    await Promise.all(redisKeys.map(key => r.del(key)));

    // Set the work to 100,000
    await r.set("work", 100000);
  }
};
