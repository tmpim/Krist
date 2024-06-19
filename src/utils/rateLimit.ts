import rateLimit from "express-rate-limit";
import promClient from "prom-client";
import RedisStore from "rate-limit-redis";
import { BurstyRateLimiter, RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "../database/redis.js";
import { REDIS_PREFIX, TEST } from "./vars.js";

const promWebserverRateLimit = new promClient.Counter({
  name: "krist_webserver_rate_limited",
  help: "Total number of requests that were rate limited."
});
const promTransactionRateLimit = new promClient.Counter({
  name: "krist_transactions_rate_limited",
  help: "Total number of transactions that were rate limited."
});

export const webserverRateLimiter = () => rateLimit({
  windowMs: 60000,
  limit: 180,
  standardHeaders: true,

  handler: (req, res, next, options) => {
    promWebserverRateLimit.inc();
    res.status(options.statusCode).json({ ok: false, error: "rate_limit_hit" });
  },

  store: new RedisStore({
    prefix: REDIS_PREFIX + "webserverRateLimiter:",
    sendCommand: (...args: string[]) => redis.sendCommand(args)
  })
});

const txIpRateLimiter = new BurstyRateLimiter(
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txIpRateLimiter:",
    points: 3, // 3 transactions
    duration: 1, // per 1 second by IP
  }),
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txIpRateLimiterBurst:",
    points: 12, // 12 transactions
    duration: 5, // per 5 seconds by IP
  })
);

const txAddressRateLimiter = new BurstyRateLimiter(
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txAddressRateLimiter:",
    points: 3, // 3 transactions
    duration: 1, // per 1 second by address
  }),
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txAddressRateLimiterBurst:",
    points: 12, // 12 transactions
    duration: 5, // per 5 seconds by address
  })
);

export async function checkTxRateLimits(
  ip: string | undefined,
  address: string,
  cost = 1
): Promise<boolean> {
  if (TEST) return true;

  try {
    await Promise.all([
      ip ? txIpRateLimiter.consume(ip, cost) : Promise.resolve(),
      txAddressRateLimiter.consume(address, cost)
    ]);

    return true;
  } catch (err) {
    console.error("Rate limit exceeded", ip, address, err);
    promTransactionRateLimit.inc();
    return false;
  }
}
