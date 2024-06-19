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
import { TEST_DEBUG } from "../../src/utils/vars.js";
import { seed } from "../seed.js";
import { api } from "../api.js";
import { Name, Address, Transaction, db } from "../../src/database/index.js";
import { redis, rKey } from "../../src/database/redis.js";
import { pick } from "lodash-es";

const expectTransactionExist = (
  id: number,
  to?: string,
  metadata?: string,
  useragent?: string,
  origin?: string
) => async () => {
  const tx = await Transaction.findByPk(id);
  expect(tx).to.exist;
  expect(tx).to.deep.include({ id, from: "k8juvewcui", to: to || "k7oax47quv", value: 1 });
  if (metadata) expect(tx!.op).to.equal(metadata);
  if (useragent) expect(tx!.useragent).to.equal(useragent);
  if (origin) expect(tx!.origin).to.equal(origin);
};

describe("v1 routes: transactions", () => {
  before(seed);

  // TODO: /?recenttx

  describe("/?pushtx", () => {
    it("should be disabled", async () => {
      const res = await api().get("/?pushtx");
      expect(res).to.be.text;
      expect(res.text).to.equal("v1 transactions disabled. Contact Krist team");
    });
  });

  describe("/?pushtx2old", () => {
    it("should not exist", async () => {
      const res = await api().get("/?pushtx2old");
      expect(res).to.be.html;
    });
  });

  describe("/?pushtx2", () => {
    it("should be disabled", async () => {
      const res = await api().get("/?pushtx2");
      expect(res).to.be.text;
      expect(res.text).to.equal("Legacy transactions disabled. Contact Krist team");
    });
  });
});

describe("v2 routes: transactions", () => {
  before(seed);

  // TODO: GET /transactions
  // TODO: GET /transactions/latest
  // TODO: GET /transactions/:id

  describe("POST /transactions - validation", () => {
    it("should disable transactions temporarily", async () => {
      await redis.set(rKey("transactions-enabled"), "false")
    });

    it("should fail if transactions are disabled", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "k7oax47quv", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "transactions_disabled" });
    })

    it("should re-enable transactions", async () => {
      await redis.set(rKey("transactions-enabled"), "true")
    });

    it("should deny unauthed addresses", async () => {
      const res = await api()
        .post("/transactions")
        .send({ to: "k7oax47quv", amount: 1, privatekey: "c" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should error with a missing 'privatekey'", async () => {
      const res = await api().post("/transactions");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should error with a missing 'to'", async () => {
      const res = await api()
        .post("/transactions")
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "to" });
    });

    it("should error with a missing 'amount'", async () => {
      const res = await api()
        .post("/transactions")
        .send({ to: "k7oax47quv", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "amount" });
    });

    it("should error with an invalid 'amount'", async () => {
      const amounts = ["a", 0, -1, "0", "-1"];
      for (const amount of amounts) {
        const res = await api()
          .post("/transactions")
          .send({ amount, to: "k7oax47quv", privatekey: "a" });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, parameter: "amount" });
      }
    });

    it("should error with an invalid 'metadata'", async () => {
      const metadataList = ["\u0000", "\u0001", "a".repeat(256)];
      for (const metadata of metadataList) {
        const res = await api()
          .post("/transactions")
          .send({ amount: 1, to: "k7oax47quv", privatekey: "a", metadata });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "metadata" });
      }
    });

    it("should error with a non-existent sender", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "k7oax47quv", privatekey: "notfound" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "insufficient_funds" });
    });

    it("should error with insufficient funds", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 11, to: "k7oax47quv", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "insufficient_funds" });
    });

    it("should error when paying to an invalid address", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "kfartoolong", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "to" });
    });

    it("should error when paying to a v1 address", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "a5dfb396d3", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "to" });
    });

    it("should error when paying to a name that doesn't exist", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "notfound.kst", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_not_found" });
    });

    it("should error when paying to a name that doesn't exist via metadata", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "k7oax47quv", privatekey: "a", metadata: "notfound.kst" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_not_found" });
    });
  });

  describe("POST /transactions", () => {
    it("should make a transaction", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "k7oax47quv", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.time).to.be.a("string");
      expect(res.body.transaction.name).to.not.be.ok;
      expect(res.body.transaction.metadata).to.not.be.ok;
      expect(res.body.transaction.useragent).to.not.be.ok;
      expect(res.body.transaction.origin).to.not.be.ok;
    });
    it("should exist in the database", expectTransactionExist(1));

    it("should have altered the balances", async () => {
      const from = await Address.findOne({ where: { address: "k8juvewcui" }});
      expect(from).to.exist;
      expect(from!.balance).to.equal(9);

      const to = await Address.findOne({ where: { address: "k7oax47quv" }});
      expect(to).to.exist;
      expect(to!.balance).to.equal(1);
    });

    it("should support metadata", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "k7oax47quv", privatekey: "a", metadata: "Hello, world!" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 2, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.metadata).to.equal("Hello, world!");
    });
    it("should exist in the database", expectTransactionExist(2, undefined, "Hello, world!"));

    it("should create a temporary name to test", async () => {
      const name = await Name.create({ name: "test", owner: "k7oax47quv", registered: new Date(), unpaid: 0 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k7oax47quv" });
    });

    it("should transact to a name's owner", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "test.kst", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 3, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.metadata).to.equal("test.kst");
      expect(res.body.transaction.sent_name).to.equal("test");
    });

    it("should preserve existing metadata with a transaction to a name", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "test.kst", privatekey: "a", metadata: "Hello, world!" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 4, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.metadata).to.equal("test.kst;Hello, world!");
      expect(res.body.transaction.sent_name).to.equal("test");
    });

    it("should support metanames", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "meta@test.kst", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 5, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.metadata).to.equal("meta@test.kst");
      expect(res.body.transaction.sent_metaname).to.equal("meta");
      expect(res.body.transaction.sent_name).to.equal("test");
    });

    it("should support metanames and preserve metadata", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "meta@test.kst", privatekey: "a", metadata: "Hello, world!" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 6, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.metadata).to.equal("meta@test.kst;Hello, world!");
      expect(res.body.transaction.sent_metaname).to.equal("meta");
      expect(res.body.transaction.sent_name).to.equal("test");
    });

    it("should transact to a new address", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "knotfound0", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 7, from: "k8juvewcui", to: "knotfound0", value: 1, type: "transfer" });
    });

    it("should have created that address", async () => {
      const address = await Address.findOne({ where: { address: "knotfound0" }});
      expect(address).to.exist;
      expect(address!.balance).to.equal(1);
    });

    it("should submit a transaction with a user-agent and origin", async () => {
      const res = await api()
        .post("/transactions")
        .set("User-Agent", "krist-test")
        .set("Origin", "https://example.com")
        .send({ amount: 1, to: "k7oax47quv", privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 8, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.useragent).to.not.be.ok;
      expect(res.body.transaction.origin).to.not.be.ok;
    });
    it("should exist in the database", expectTransactionExist(8, undefined, undefined, "krist-test", "https://example.com"));

    it("should transact to a name's owner via metadata", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "k7oax47quv", privatekey: "a", metadata: "test.kst" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 9, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.metadata).to.equal("test.kst");
      expect(res.body.transaction.sent_name).to.equal("test");
    });

    it("should transact to a name's owner even when metadata is present", async () => {
      const res = await api()
        .post("/transactions")
        .send({ amount: 1, to: "test.kst", privatekey: "a", metadata: "notfound.kst" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.transaction).to.be.an("object");
      expect(res.body.transaction).to.deep.include({ id: 10, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.body.transaction.metadata).to.equal("test.kst;notfound.kst");
      expect(res.body.transaction.sent_name).to.equal("test");
    });
  });
});

describe("transaction edge cases", () => {
  before(seed);

  it("should truncate decimal transactions", async () => {
    const res = await api()
      .post("/transactions")
      .send({ amount: 1.5, to: "k7oax47quv", privatekey: "a" });

    expect(res).to.be.json;
    expect(res.body).to.deep.include({ ok: true });
    expect(res.body.transaction).to.be.an("object");
    expect(res.body.transaction).to.deep.include({ from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
  });

  it("should handle large simultaneous transactions", async () => {
    const sendTx = () => api()
      .post("/transactions")
      .send({ amount: 25000, to: "kwsgj3x184", privatekey: "d" });

    const results = await Promise.all([sendTx(), sendTx(), sendTx()]);
    let succeeded = 0, failed = 0;
    for (const res of results) {
      if (res.body.ok && !res.body.error) {
        succeeded++;
      } else {
        failed++;
      }
    }

    expect(succeeded).to.equal(1);
    expect(failed).to.equal(2);

    const addr1 = await Address.findOne({ where: { address: "k0duvsr4qn" }});
    expect(addr1).to.be.ok;
    expect(addr1!.balance).to.equal(0);
    const addr2 = await Address.findOne({ where: { address: "kwsgj3x184" }});
    expect(addr2).to.be.ok;
    expect(addr2!.balance).to.equal(25000);
  });

  async function bulkTransactionTest(count: number) {
    const start = 25000;

    // Reset the balances of the testing addresses
    await Address.update({ balance: start }, { where: { address: "k0duvsr4qn" }});
    await Address.update({ balance: 0 }, { where: { address: "kwsgj3x184" }});

    const sendTx = () => api()
      .post("/transactions")
      .send({ amount: 1, to: "kwsgj3x184", privatekey: "d" });

    // Continuously monitor the state of the DB pool until the test is complete
    let poolCheckTimer: NodeJS.Timeout | null = null;
    if (TEST_DEBUG) {
      poolCheckTimer = setInterval(async () => {
        const read = pick(db.pool.read, ["size", "available", "using", "waiting", "minSize", "maxSize"]);
        const write = pick(db.pool.write, ["size", "available", "using", "waiting", "minSize", "maxSize"]);
        console.log("bulkTransactionTest", count, "Read pool:", read, "Write pool:", write);
      }, 250).unref();
    }

    const results = await Promise.all([...Array(count).keys()].map(sendTx));
    let succeeded = 0, failed = 0;
    for (const res of results) {
      if (res.body.ok && !res.body.error) {
        succeeded++;
      } else {
        failed++;
      }
    }

    expect(succeeded).to.equal(count);
    expect(failed).to.equal(0);

    const addr1 = await Address.findOne({ where: { address: "k0duvsr4qn" }});
    expect(addr1).to.be.ok;
    expect(addr1!.balance).to.equal(start - count);
    const addr2 = await Address.findOne({ where: { address: "kwsgj3x184" }});
    expect(addr2).to.be.ok;
    expect(addr2!.balance).to.equal(count);

    if (poolCheckTimer) clearInterval(poolCheckTimer);
  }

  it("should not error when sending 5 transactions at once", function() {
    this.timeout(5000);
    return bulkTransactionTest(5);
  });

  it("should not error when sending 25 transactions at once", function() {
    this.timeout(5000);
    return bulkTransactionTest(25);
  });

  it("should not error when sending 100 transactions at once", function() {
    this.timeout(15000);
    return bulkTransactionTest(100);
  });
});
