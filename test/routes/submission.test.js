const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");

describe("v1 routes: submission", () => {
  before(seed);

  // TODO: /?submitblock
});

describe("v2 routes: submission", () => {
  before(seed);
  
  describe("POST /submit - validation", () => {
    it("should disable mining temporarily", async () => {
      const redis = require("../../src/redis");
      const r = redis.getRedis();
      await r.set("mining-enabled", false);
    });

    it("should fail if mining is disabled", async () => {
      const res = await api().post("/submit");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "mining_disabled" });
    });
    
    it("should re-enable mining", async () => {
      const redis = require("../../src/redis");
      const r = redis.getRedis();
      await r.set("mining-enabled", true);
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

  describe("POST /submit - successful", () => {
    it("should submit a block", async () => {
      const res = await api()
        .post("/submit")
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
  });  
});
