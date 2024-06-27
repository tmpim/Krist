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
import { seed } from "../seed.js";
import { newConnection } from "../ws.js";

describe("websocket routes: submission", function() {
  before(seed);
  this.retries(4);

  async function send(data: any, privatekey?: string) {
    const ws = await newConnection(privatekey);
    expect(ws).to.nested.include({ "wsp.isOpened": true });

    const res = await ws.sendAndWait({ type: "submit_block", ...data });
    expect(res).to.be.an("object");
    return [res, ws];
  }

  describe("submit_block - validation", function() {
    it("should error with a missing address for guests", async function() {
      const [res, ws] = await send({});
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "address" });
      ws.close();
    });

    it("should not error with a missing address for authed users", async function() {
      const [res, ws] = await send({}, "a");
      expect(res).to.not.deep.include({ ok: false, error: "missing_parameter", parameter: "address" });
      ws.close();
    });

    it("should disable mining temporarily", async function() {
      await redis.set(rKey("mining-enabled"), "false");
    });

    it("should fail if mining is disabled", async function() {
      const [res, ws] = await send({ address: "k8juvewcui" });
      expect(res).to.deep.include({ ok: false, error: "mining_disabled" });
      ws.close();
    });

    it("should re-enable mining", async function() {
      await redis.set(rKey("mining-enabled"), "true");
    });

    /*
    it("should require a valid address", async () => {
      const [res, ws] = await send({ address: "kfartoolong" });
      expect(res).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
      ws.close();
    });

    it("should reject v1 addresses", async () => {
      const [res, ws] = await send({ address: "a5dfb396d3" });
      expect(res).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
      ws.close();
    });

    it("should require a nonce", async () => {
      const [res, ws] = await send({ address: "k8juvewcui" });
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "nonce" });
      ws.close();
    });

    it("should reject long nonces", async () => {
      const [res, ws] = await send({ address: "k8juvewcui", nonce: "a".repeat(25) });
      expect(res).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "nonce" });
      ws.close();
    });

    it("should support binary nonces", async () => {
      const [res, ws] = await send({ address: "k8juvewcui", nonce: [1, 2, 3] });
      expect(res).to.deep.include({ ok: true, success: false });
      ws.close();
    });

    it("should reject an invalid block", async () => {
      const [res, ws] = await send({ address: "k8juvewcui", nonce: "invalid" });
      expect(res).to.deep.include({ ok: true, success: false });
      ws.close();
    });
    */
  });

  describe("submit_block", function() {
    /*
    it("should submit a block", async () => {
      const [res, ws] = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
      expect(res).to.deep.include({ ok: true, success: true });

      expect(res.address).to.be.an("object");
      expect(res.address).to.deep.include({ address: "k8juvewcui", balance: 35 });

      expect(res.block).to.be.an("object");
      expect(res.block).to.deep.include({
        height: 2, value: 25,
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        short_hash: "000000012697",
        difficulty: 400000000000 // legacy work handling
      });

      ws.close();
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
      const [res, ws] = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
      expect(res).to.deep.include({ ok: true, success: false, error: "solution_duplicate" });
      ws.close();
    });

    it("should reset the database", seed);

    it("should submit a block with a binary nonce", async () => {
      const [res, ws] = await send({ address: "k8juvewcui", nonce: [37,35,68,69,81,39,35,43,85,88,41] });
      expect(res).to.deep.include({ ok: true, success: true });

      expect(res.block).to.be.an("object");
      expect(res.block).to.deep.include({
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        short_hash: "000000012697"
      });

      ws.close();
    });

    it("should reset the database", seed);

    it("should decrease unpaid names", async () => {
      const name = await Name.create({ name: "test", owner: "k0duvsr4qn", registered: new Date(), unpaid: 500 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k0duvsr4qn", unpaid: 500 });

      const [res, ws] = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
      expect(res).to.deep.include({ ok: true, success: true });

      expect(res.block).to.deep.include({ height: 2, value: 26 });

      await name.reload();

      expect(name.unpaid).to.equal(499);

      ws.close();
    });

    it("should reset the database", seed);

    it("should submit a block when authed", async () => {
      const [res, ws] = await send({ nonce: "%#DEQ'#+UX)" }, "a");
      expect(res).to.deep.include({ ok: true, success: true });

      expect(res.address).to.be.an("object");
      expect(res.address).to.deep.include({ address: "k8juvewcui", balance: 35 });

      expect(res.block).to.be.an("object");
      expect(res.block).to.deep.include({
        height: 2, value: 25,
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        short_hash: "000000012697",
        difficulty: 400000000000 // legacy work handling
      });

      ws.close();
    });

    it("should reset the database", seed);

    it("should submit a block as another address when authed", async () => {
      const [res, ws] = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" }, "d");
      expect(res).to.deep.include({ ok: true, success: true });

      expect(res.address).to.be.an("object");
      expect(res.address).to.deep.include({ address: "k8juvewcui", balance: 35 });

      expect(res.block).to.be.an("object");
      expect(res.block).to.deep.include({
        height: 2, value: 25,
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        short_hash: "000000012697",
        difficulty: 400000000000 // legacy work handling
      });

      ws.close();
    });
    */
  });
});
