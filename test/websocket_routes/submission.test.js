const { expect } = require("chai");

const { seed } = require("../seed");
const { newConnection } = require("../ws");

describe("websocket routes: submission", function() {
  before(seed);
  this.retries(4);

  async function send(data, privatekey) {
    const ws = await newConnection(privatekey);
    expect(ws).to.nested.include({ "wsp.isOpened": true });

    const res = await ws.sendAndWait({ type: "submit_block", ...data });
    expect(res).to.exist;
    return res;
  }

  describe("submit_block - validation", () => {
    it("should error with a missing address for guests", async () => {
      const res = await send({});
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "address" });
    });

    it("should not error with a missing address for authed users", async () => {
      const res = await send({}, "a");
      expect(res).to.not.deep.include({ ok: false, error: "missing_parameter", parameter: "address" });
    });
    
    it("should disable mining temporarily", async () => {
      const redis = require("../../src/redis");
      const r = redis.getRedis();
      await r.set("mining-enabled", false);
    });

    it("should fail if mining is disabled", async () => {
      const res = await send({ address: "k8juvewcui" });
      expect(res).to.deep.include({ ok: false, error: "mining_disabled" });
    });
    
    it("should re-enable mining", async () => {
      const redis = require("../../src/redis");
      const r = redis.getRedis();
      await r.set("mining-enabled", true);
    });

    it("should require a valid address", async () => {
      const res = await send({ address: "kfartoolong" });
      expect(res).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
    });

    it("should require a nonce", async () => {
      const res = await send({ address: "k8juvewcui" });
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "nonce" });
    });

    it("should reject long nonces", async () => {
      const res = await send({ address: "k8juvewcui", nonce: "a".repeat(25) });
      expect(res).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "nonce" });
    });

    it("should support binary nonces", async () => {
      const res = await send({ address: "k8juvewcui", nonce: [1, 2, 3] });
      expect(res).to.deep.include({ ok: true, success: false });
    });

    it("should reject an invalid block", async () => {
      const res = await send({ address: "k8juvewcui", nonce: "invalid" });
      expect(res).to.deep.include({ ok: true, success: false });
    });
  });
  
  describe("submit_block", () => {
    it("should submit a block", async () => {
      const res = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
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
    });  
    
    it("should exist in the database", async () => {
      const schemas = require("../../src/schemas");

      const block = await schemas.block.findOne({ order: [["id", "DESC"]] });
      expect(block).to.exist;
      expect(block).to.deep.include({ 
        id: 2, value: 25, 
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        nonce: "252344455127232b555829",
        difficulty: 100000 // real work value
      });
    });

    it("should have updated the miner's balance", async () => {
      const schemas = require("../../src/schemas");

      const address = await schemas.address.findOne({ where: { address: "k8juvewcui" } });
      expect(address).to.exist;
      expect(address.balance).to.equal(35);
    });

    it("should have decreased the work", async () => {
      const Krist = require("../../src/krist");
      const work = await Krist.getWork();
      expect(work).to.be.lessThan(100000);
    });
    
    it("should reject a duplicate hash", async () => {
      const schemas = require("../../src/schemas");

      // Remove the genesis block and insert it again, so that the hash will be 
      // duplicate on submission
      const oldBlock = await schemas.block.findOne({ where: { hash: "0000000000000000000000000000000000000000000000000000000000000000" }});
      expect(oldBlock).to.exist;
      await oldBlock.destroy();

      const block = await schemas.block.create({
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
      const res = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
      expect(res).to.deep.include({ ok: true, success: false, error: "solution_duplicate" });
    });

    it("should reset the database", seed);

    it("should submit a block with a binary nonce", async () => {
      const res = await send({ address: "k8juvewcui", nonce: [37,35,68,69,81,39,35,43,85,88,41] });
      expect(res).to.deep.include({ ok: true, success: true });

      expect(res.block).to.be.an("object");
      expect(res.block).to.deep.include({ 
        hash: "000000012697b461b9939933d5dec0cae546b7ec61b2d09a92226474711f0819",
        short_hash: "000000012697"
      });
    });

    it("should reset the database", seed);

    it("should decrease unpaid names", async () => {
      const schemas = require("../../src/schemas");
      
      const name = await schemas.name.create({ name: "test", owner: "k0duvsr4qn", registered: new Date(), unpaid: 500 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k0duvsr4qn", unpaid: 500 });

      const res = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" });
      expect(res).to.deep.include({ ok: true, success: true });

      expect(res.block).to.deep.include({ height: 2, value: 26 });

      await name.reload();

      expect(name.unpaid).to.equal(499);
    });

    it("should reset the database", seed);

    it("should submit a block when authed", async () => {
      const res = await send({ nonce: "%#DEQ'#+UX)" }, "a");
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
    });  

    it("should reset the database", seed);

    it("should submit a block as another address when authed", async () => {
      const res = await send({ address: "k8juvewcui", nonce: "%#DEQ'#+UX)" }, "d");
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
    });
  });
});
