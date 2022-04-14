/*
 * Copyright 2016 - 2022 Drew Edwards, tmpim
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

import { seed } from "../seed";
import { api } from "../api";

import { Block, Address, Transaction, Name } from "../../src/database";
import { redis, rKey } from "../../src/database/redis";

import { getWork } from "../../src/krist/work";

describe("v1 routes: submission", () => {
  before(seed);

  describe("/?submitblockold", () => {
    it("should not exist", async () => {
      const res = await api().get("/?submitblockold");
      expect(res).to.be.html;
    });
  });

  describe("/?submitblock - validation", () => {
    it("should disable mining temporarily", async () => {
      await redis.set(rKey("mining-enabled"), "false");
    });

    it("should fail if mining is disabled", async () => {
      const res = await api().get("/?submitblock");
      expect(res).to.be.text;
      expect(res.text).to.equal("Mining disabled");
    });

    it("should re-enable mining", async () => {
      await redis.set(rKey("mining-enabled"), "true");
    });

    it("should require an address", async () => {
      const res = await api().get("/?submitblock");
      expect(res).to.be.text;
      expect(res.text).to.equal("Invalid address");
    });

    it("should require a valid address", async () => {
      const res = await api().get("/?submitblock").query({ address: "kfartoolong" });
      expect(res).to.be.text;
      expect(res.text).to.equal("Invalid address");
    });

    it("should reject v1 addresses", async () => {
      const res = await api().get("/?submitblock").query({ address: "a5dfb396d3" });
      expect(res).to.be.text;
      expect(res.text).to.equal("Invalid address");
    });

    it("should require a nonce", async () => {
      const res = await api().get("/?submitblock").query({ address: "k8juvewcui" });
      expect(res).to.be.text;
      expect(res.text).to.equal("Nonce is too large"); // wtf??
    });

    it("should reject long nonces", async () => {
      const res = await api().get("/?submitblock").query({ address: "k8juvewcui", nonce: "a".repeat(25) });
      expect(res).to.be.text;
      expect(res.text).to.equal("Nonce is too large");
    });

    it("should reject an invalid block", async () => {
      const res = await api().get("/?submitblock").query({ address: "k8juvewcui", nonce: "invalid" });
      expect(res).to.be.text;
      expect(res.text).to.equal("k8juvewcui000000000000invalid");
    });
  });

  describe("/?submitblock", () => {
    it("should submit a block", async () => {
      const res = await api()
        .get("/?submitblock")
        .set("User-Agent", "krist-test")
        .set("Origin", "https://example.com")
        .query({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });

      expect(res).to.be.text;
      expect(res.text).to.equal("Block solved");
    });

    it("should exist in the database", async () => {
      const block = await Block.findOne({ order: [["id", "DESC"]] });
      expect(block).to.exist;
      expect(block).to.deep.include({
        id: 2, value: 25,
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        nonce: "252344455127232b555829",
        difficulty: 100000 // real work value
      });
    });

    it("should have created a transaction", async () => {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({
        id: 1,
        value: 25,
        to: "k8juvewcui",
        useragent: "krist-test",
        origin: "https://example.com"
      });
      expect(tx!.from).to.not.be.ok;
    });

    it("should have updated the miner's balance", async () => {
      const address = await Address.findOne({ where: { address: "k8juvewcui" } });
      expect(address).to.exist;
      expect(address!.balance).to.equal(35);
    });

    it("should have decreased the work", async () => {
      const work = await getWork();
      expect(work).to.be.lessThan(100000);
    });

    it("should reject a duplicate hash", async () => {
      // Remove the genesis block and insert it again, so that the hash will be
      // duplicate on submission
      const oldBlock = await Block.findOne({ where: { hash: "0000000000000000000000000000000000000000000000000000000000000000" }});
      expect(oldBlock).to.exist;
      await oldBlock!.destroy();

      const block = await Block.create({
        value: 50,
        hash: "0000000000000000000000000000000000000000000000000000000000000000",
        address: "0000000000",
        nonce: 0,
        difficulty: 4294967295,
        time: new Date()
      });
      expect(block).to.exist;
      expect(block.hash).to.equal("0000000000000000000000000000000000000000000000000000000000000000");

      // Submit the duplicate block hash
      const res = await api().get("/?submitblock").query({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
      expect(res).to.be.text;
      expect(res.text).to.equal("Solution rejected");
    });

    it("should reset the database", seed);

    it("should decrease unpaid names", async () => {
      const name = await Name.create({ name: "test", owner: "k0duvsr4qn", registered: new Date(), unpaid: 500 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k0duvsr4qn", unpaid: 500 });

      const res = await api().get("/?submitblock").query({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
      expect(res).to.be.text;
      expect(res.text).to.equal("Block solved");

      await name.reload();

      expect(name.unpaid).to.equal(499);
    });
  });
});

describe("v2 routes: submission", () => {
  before(seed);

  describe("POST /submit - validation", () => {
    it("should disable mining temporarily", async () => {
      await redis.set(rKey("mining-enabled"), "false");
    });

    it("should fail if mining is disabled", async () => {
      const res = await api().post("/submit");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "mining_disabled" });
    });

    it("should re-enable mining", async () => {
      await redis.set(rKey("mining-enabled"), "true");
    });

    it("should require an address", async () => {
      const res = await api().post("/submit");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "address" });
    });

    it("should require a valid address", async () => {
      const res = await api()
        .post("/submit")
        .send({ address: "kfartoolong" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
    });

    it("should reject v1 addresses", async () => {
      const res = await api()
        .post("/submit")
        .send({ address: "a5dfb396d3" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
    });

    it("should require a nonce", async () => {
      const res = await api()
        .post("/submit")
        .send({ address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "nonce" });
    });

    it("should reject long nonces", async () => {
      const res = await api()
        .post("/submit")
        .send({ address: "k8juvewcui", nonce: "a".repeat(25) });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "nonce" });
    });

    it("should support binary nonces", async () => {
      const res = await api()
        .post("/submit")
        .send({ address: "k8juvewcui", nonce: [1, 2, 3] });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, success: false });
    });

    it("should reject an invalid block", async () => {
      const res = await api()
        .post("/submit")
        .send({ address: "k8juvewcui", nonce: "invalid" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, success: false });
    });
  });

  describe("POST /submit", () => {
    it("should submit a block", async () => {
      const res = await api()
        .post("/submit")
        .set("User-Agent", "krist-test")
        .set("Origin", "https://example.com")
        .send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });

      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, success: true });

      expect(res.body.address).to.be.an("object");
      expect(res.body.address).to.deep.include({ address: "k8juvewcui", balance: 35 });

      expect(res.body.block).to.be.an("object");
      expect(res.body.block).to.deep.include({
        height: 2, value: 25,
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        short_hash: "000000012697",
        difficulty: 400000000000 // legacy work handling
      });

      expect(res.body.block.useragent).to.not.be.ok;
      expect(res.body.block.origin).to.not.be.ok;
    });

    it("should exist in the database", async () => {
      const block = await Block.findOne({ order: [["id", "DESC"]] });
      expect(block).to.exist;
      expect(block).to.deep.include({
        id: 2, value: 25,
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        nonce: "252344455127232b555829",
        difficulty: 100000, // real work value
        useragent: "krist-test",
        origin: "https://example.com"
      });
    });

    it("should have created a transaction", async () => {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({
        id: 1,
        value: 25,
        to: "k8juvewcui",
        useragent: "krist-test",
        origin: "https://example.com"
      });
      expect(tx!.from).to.not.be.ok;
    });

    it("should have updated the miner's balance", async () => {
      const address = await Address.findOne({ where: { address: "k8juvewcui" } });
      expect(address).to.exist;
      expect(address!.balance).to.equal(35);
    });

    it("should have decreased the work", async () => {
      const work = await getWork();
      expect(work).to.be.lessThan(100000);
    });

    it("should reject a duplicate hash", async () => {
      // Remove the genesis block and insert it again, so that the hash will be
      // duplicate on submission
      const oldBlock = await Block.findOne({ where: { hash: "0000000000000000000000000000000000000000000000000000000000000000" }});
      expect(oldBlock).to.exist;
      await oldBlock!.destroy();

      const block = await Block.create({
        value: 50,
        hash: "0000000000000000000000000000000000000000000000000000000000000000",
        address: "0000000000",
        nonce: 0,
        difficulty: 4294967295,
        time: new Date()
      });
      expect(block).to.exist;
      expect(block.hash).to.equal("0000000000000000000000000000000000000000000000000000000000000000");

      // Submit the duplicate block hash
      const res = await api()
        .post("/submit")
        .send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, success: false, error: "solution_duplicate" });
    });

    it("should reset the database", seed);

    it("should submit a block with a binary nonce", async () => {
      const res = await api()
        .post("/submit")
        .send({ address: "k8juvewcui", nonce: [37,35,68,69,81,39,35,43,85,88,41] });

      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, success: true });

      expect(res.body.block).to.be.an("object");
      expect(res.body.block).to.deep.include({
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        short_hash: "000000012697"
      });
    });

    it("should reset the database", seed);

    it("should decrease unpaid names", async () => {
      const name = await Name.create({ name: "test", owner: "k0duvsr4qn", registered: new Date(), unpaid: 500 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k0duvsr4qn", unpaid: 500 });

      const res = await api()
        .post("/submit")
        .send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });

      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, success: true });

      expect(res.body.block).to.deep.include({ height: 2, value: 26 });

      await name.reload();

      expect(name.unpaid).to.equal(499);
    });
  });
});
