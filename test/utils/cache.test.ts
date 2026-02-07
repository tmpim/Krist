/*
 * Copyright 2016 - 2024 Drew Edwards, tmpim
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

import { expect } from "chai";
import { redis, rKey } from "../../src/database/redis.js";
import { Transaction } from "../../src/database/index.js";
import {
  cachedCount,
  cachedFindAndCountAll,
  invalidateCountCache,
  startAutomaticCacheInvalidation,
  stopAutomaticCacheInvalidation
} from "../../src/utils/cache.js";
import { seed } from "../seed.js";

describe("utils - cache", function() {
  before(async function() {
    await seed();
    // Create some test transactions for the cache tests
    await Transaction.bulkCreate([
      { from: "k8juvewcui", to: "k7oax47quv", value: 1, time: new Date() },
      { from: "k8juvewcui", to: "k7oax47quv", value: 1, time: new Date() },
      { from: "k7oax47quv", to: "k8juvewcui", value: 0, time: new Date() }
    ]);
  });

  beforeEach(async function() {
    // Clear all Transaction caches before each test
    await invalidateCountCache(Transaction.name);
  });

  describe("cachedFindAndCountAll", function() {
    it("should cache count results", async function() {
      const result1 = await cachedFindAndCountAll(Transaction, {
        where: { from: "khugehlhri" },
        limit: 10,
        offset: 0
      }, "TestPrefix");

      expect(result1.count).to.be.a("number");
      expect(result1.rows).to.be.an("array");

      // Second call should use cache
      const result2 = await cachedFindAndCountAll(Transaction, {
        where: { from: "khugehlhri" },
        limit: 10,
        offset: 0
      }, "TestPrefix");

      expect(result2.count).to.equal(result1.count);
    });

    it("should cache different queries separately", async function() {
      const result1 = await cachedFindAndCountAll(Transaction, {
        where: { value: 1 },
        limit: 10,
        offset: 0
      }, "TestPrefix");

      const result2 = await cachedFindAndCountAll(Transaction, {
        where: { value: 0 },
        limit: 10,
        offset: 0
      }, "TestPrefix");

      // These should be different counts (different values)
      expect(result1.count).to.not.equal(result2.count);
    });

    it("should return cached count with fresh rows", async function() {
      const result1 = await cachedFindAndCountAll(Transaction, {
        where: { from: "khugehlhri" },
        order: [["id", "DESC"]],
        limit: 5,
        offset: 0
      }, "TestPrefix");

      expect(result1.rows).to.have.lengthOf.at.most(5);

      // Second call with different limit should use cached count but fetch new rows
      const result2 = await cachedFindAndCountAll(Transaction, {
        where: { from: "khugehlhri" },
        order: [["id", "DESC"]],
        limit: 3,
        offset: 0
      }, "TestPrefix");

      expect(result2.count).to.equal(result1.count);
      expect(result2.rows).to.have.lengthOf.at.most(3);
    });

    it("should use model.name as default prefix", async function() {
      const result = await cachedFindAndCountAll(Transaction, {
        where: { from: "khugehlhri" },
        limit: 10,
        offset: 0
      });

      expect(result.count).to.be.a("number");

      // Check that cache key uses Transaction as prefix
      const keys = await redis.keys(rKey("Transaction:count:*"));
      expect(keys).to.have.lengthOf.at.least(1);
    });
  });

  describe("cachedCount", function() {
    it("should cache count results", async function() {
      const count1 = await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "TestPrefix");

      expect(count1).to.be.a("number");

      // Second call should use cache
      const count2 = await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "TestPrefix");

      expect(count2).to.equal(count1);
    });

    it("should cache different queries separately", async function() {
      const count1 = await cachedCount(Transaction, {
        where: { value: 1 }
      }, "TestPrefix");

      const count2 = await cachedCount(Transaction, {
        where: { value: 0 }
      }, "TestPrefix");

      // These should be different counts (different values)
      expect(count1).to.not.equal(count2);
    });

    it("should use model.name as default prefix", async function() {
      const count = await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      });

      expect(count).to.be.a("number");

      // Check that cache key uses Transaction as prefix
      const keys = await redis.keys(rKey("Transaction:count:*"));
      expect(keys).to.have.lengthOf.at.least(1);
    });
  });

  describe("invalidateCountCache", function() {
    it("should invalidate all caches for a prefix", async function() {
      // Create some cached entries
      await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "TestPrefix");

      await cachedCount(Transaction, {
        where: { to: "khugehlhri" }
      }, "TestPrefix");

      // Invalidate all test caches
      await invalidateCountCache("TestPrefix");

      // Check that cache keys are gone
      const keys = await redis.keys(rKey("TestPrefix:count:*"));
      expect(keys).to.have.lengthOf(0);
    });

    it("should not affect other prefixes", async function() {
      // Create cached entries with different prefixes
      await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "TestPrefix1");

      await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "TestPrefix2");

      // Invalidate only TestPrefix1
      await invalidateCountCache("TestPrefix1");

      // TestPrefix1 should be gone
      const keys1 = await redis.keys(rKey("TestPrefix1:count:*"));
      expect(keys1).to.have.lengthOf(0);

      // TestPrefix2 should still exist
      const keys2 = await redis.keys(rKey("TestPrefix2:count:*"));
      expect(keys2).to.have.lengthOf.at.least(1);

      // Cleanup
      await invalidateCountCache("TestPrefix2");
    });
  });

  describe("automatic cache invalidation", function() {
    it("should start automatically on first query", async function() {
      // Create a cached entry - this should auto-start the timer
      await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "AutoTestPrefix");

      // Cache should exist
      const keys = await redis.keys(rKey("AutoTestPrefix:count:*"));
      expect(keys).to.have.lengthOf.at.least(1);

      // Stop and cleanup
      stopAutomaticCacheInvalidation("AutoTestPrefix");
      await invalidateCountCache("AutoTestPrefix");
    });

    it("should start and stop manual invalidation", async function() {
      // Create a cached entry
      await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "ManualTestPrefix");

      // Start automatic invalidation manually
      startAutomaticCacheInvalidation("ManualTestPrefix");

      // Stop it immediately
      stopAutomaticCacheInvalidation("ManualTestPrefix");

      // Cache should still exist since we stopped before it ran
      const keys = await redis.keys(rKey("ManualTestPrefix:count:*"));
      expect(keys).to.have.lengthOf.at.least(1);

      // Cleanup
      await invalidateCountCache("ManualTestPrefix");
    });
  });

  describe("cache key generation", function() {
    it("should generate same key for identical queries", async function() {
      const where = { from: "khugehlhri" };

      await cachedCount(Transaction, { where }, "KeyTestPrefix");

      // Same query should hit cache
      const count = await cachedCount(Transaction, { where }, "KeyTestPrefix");
      expect(count).to.be.a("number");

      // Cleanup
      stopAutomaticCacheInvalidation("KeyTestPrefix");
      await invalidateCountCache("KeyTestPrefix");
    });

    it("should generate different keys for different queries", async function() {
      await cachedCount(Transaction, {
        where: { from: "khugehlhri" }
      }, "KeyTestPrefix2");

      await cachedCount(Transaction, {
        where: { to: "khugehlhri" }
      }, "KeyTestPrefix2");

      // Should have 2 different cache keys
      const keys = await redis.keys(rKey("KeyTestPrefix2:count:*"));
      expect(keys).to.have.lengthOf(2);

      // Cleanup
      stopAutomaticCacheInvalidation("KeyTestPrefix2");
      await invalidateCountCache("KeyTestPrefix2");
    });
  });

  afterEach(async function() {
    // Clean up test cache entries and stop timers
    const testPrefixes = [
      "TestPrefix", "TestPrefix1", "TestPrefix2",
      "AutoTestPrefix", "ManualTestPrefix",
      "KeyTestPrefix", "KeyTestPrefix2",
      "Transaction" // Clean up default model name caches from tests
    ];

    for (const prefix of testPrefixes) {
      stopAutomaticCacheInvalidation(prefix);
      await invalidateCountCache(prefix);
    }
  });
});
