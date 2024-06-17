import { BurstyRateLimiter, RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "../database/redis.js";
import { REDIS_PREFIX } from "./vars.js";

export const txIpRateLimiter = new BurstyRateLimiter(
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txIpRateLimiter",
    points: 2, // 2 transactions
    duration: 1, // per 1 second by IP
  }),
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txIpRateLimiterBurst",
    points: 10, // 10 transactions
    duration: 5, // per 5 seconds by IP
  })
);

export const txAddressRateLimiter = new BurstyRateLimiter(
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txAddressRateLimiter",
    points: 2, // 2 transactions
    duration: 1, // per 1 second by address
  }),
  new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: REDIS_PREFIX + "txAddressRateLimiterBurst",
    points: 10, // 10 transactions
    duration: 5, // per 5 seconds by address
  })
);
