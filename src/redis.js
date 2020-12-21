const chalk = require("chalk");
const { createNodeRedisClient } = require("handy-redis");

let redis;

module.exports = {
  getRedis() {
    return redis;  
  },

  init() {
    const host = process.env.REDIS_HOST || "127.0.0.1";
    const port = parseInt(process.env.REDIS_PORT) || 6379;
    const prefix = process.env.REDIS_PREFIX || "krist:";
    
    console.log(chalk.blue("Connecting to redis"));
    redis = createNodeRedisClient({
      host,
      port,
      prefix
    });
    console.log(chalk.green("Connected to redis"));
  }
};
