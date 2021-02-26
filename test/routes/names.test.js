const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");

describe("v1 routes: names", () => {
  before(seed);

  // TODO: /?dumpnames
  // TODO: /?a
  // TODO: /?getowner
  // TODO: /?nameCost
  // TODO: /?namebonus
  // TODO: /?getnames
  // TODO: /?listnames
  // TODO: /?getnewdomains
  // TODO: /?name_check
  // TODO: /?name_new
  // TODO: /?name_transfer
  // TODO: /?name_update
});

describe("v2 routes: names", () => {
  before(seed);

  // TODO: GET /names/check/:name
  // TODO: GET /names/cost
  // TODO: GET /names/bonus
  // TODO: GET /names
  // TODO: GET /names/new
  // TODO: GET /names/:name
  // TODO: GET /names/:name

  describe("POST /names/:name - validation", () => {
    it("should require a privatekey", async () => {
      const res = await api().post("/names/test");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should reject long names", async () => {
      const res = await api()
        .post("/names/" + "a".repeat(65))
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
    });

    it("should reject names with invalid characters", async () => {
      const invalidNames = ["test.kst", " ", "te st", "_"];
      for (const name of invalidNames) {
        const res = await api()
          .post("/names/" + encodeURIComponent(name))
          .send({ privatekey: "a" });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
      }
    });

    it("should not purchase a name when auth fails", async () => {
      const res = await api()
        .post("/names/test")
        .send({ privatekey: "c" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should reject names that already exist", async () => {
      const schemas = require("../../src/schemas");

      const name = await schemas.name.create({ name: "test2", owner: "k8juvewcui", registered: new Date(), unpaid: 0 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test2", owner: "k8juvewcui" });

      const res = await api()
        .post("/names/test2")
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_taken" });
    });

    it("should reject with insufficient funds", async () => {
      const res = await api()
        .post("/names/test")
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "insufficient_funds" });
    });
  });

  describe("POST /names/:name", () => {
    before(seed);

    it("should purchase a name", async () => {
      const res = await api()
        .post("/names/test")
        .send({ privatekey: "d" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
    });

    it("should exist in the database", async () => {
      const schemas = require("../../src/schemas");

      const name = await schemas.name.findOne();
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k0duvsr4qn", unpaid: 500 });
    });

    it("should have created a transaction", async () => {
      const schemas = require("../../src/schemas");

      const tx = await schemas.transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k0duvsr4qn", to: "name", name: "test", value: 500 });
    });

    it("should have decreased the buyer's balance", async () => {
      const schemas = require("../../src/schemas");

      const address = await schemas.address.findOne({ where: { address: "k0duvsr4qn" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 24500 });
    });

    it("should have increased the block value", async () => {
      const Blocks = require("../../src/blocks");
      const value = await Blocks.getBlockValue();
      expect(value).to.equal(26);
    });
  });

  describe("POST /names/:name/transfer - validation", () => {
    it("should require a privatekey", async () => {
      const res = await api().post("/names/test/transfer");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should require an address", async () => {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "d" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "address" });
    });

    it("should reject invalid names", async () => {
      const res = await api()
        .post("/names/" + ("a".repeat(65)) + "/transfer")
        .send({ privatekey: "a", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
    });

    it("should reject invalid addresses", async () => {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "a", address: "kfartoolong" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
    });

    it("should reject v1 addresses", async () => {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "a", address: "a5dfb396d3" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
    });

    it("should not transfer a name when auth fails", async () => {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "c", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should reject when the name does not exist", async () => {
      const res = await api()
        .post("/names/notfound/transfer")
        .send({ privatekey: "d", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_not_found" });
    });

    it("should reject when not the owner of the name", async () => {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "a", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "not_name_owner" });
    });
  });

  describe("POST /names/:name/transfer", () => {
    it("should transfer a name", async () => {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "d", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui" });
      expect(res.body.name.updated).to.be.ok;
    });

    it("should have updated the database", async () => {
      const schemas = require("../../src/schemas");

      const name = await schemas.name.findOne({ where: { name: "test" }});
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k8juvewcui" });
      expect(name.updated).to.be.ok;
    });

    it("should have created a transaction", async () => {
      const schemas = require("../../src/schemas");

      const tx = await schemas.transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k0duvsr4qn", to: "k8juvewcui", name: "test", value: 0 });
    });

    it("should not have changed the old owner's balance", async () => {
      const schemas = require("../../src/schemas");

      const address = await schemas.address.findOne({ where: { address: "k0duvsr4qn" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 24500 });
    });

    it("should not have changed the new owner's balance", async () => {
      const schemas = require("../../src/schemas");

      const address = await schemas.address.findOne({ where: { address: "k8juvewcui" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 10 });
    });
  });

  const nameUpdateValidation = (route, method) => () => {
    it("should require a privatekey", async () => {
      const res = await api()[method]("/names/test" + route);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should reject long names", async () => {
      const res = await api()[method]("/names/" + "a".repeat(65) + route)
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
    });

    it("should reject names with invalid characters", async () => {
      const invalidNames = ["test.kst", " ", "te st", "_"];
      for (const name of invalidNames) {
        const res = await api()[method]("/names/" + encodeURIComponent(name) + route)
          .send({ privatekey: "a" });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
      }
    });

    it("should reject invalid a records", async () => {
      const invalidRecords = ["#foo", "?foo", "foo bar", " foo", "foo ", "a".repeat(256)];
      for (const record of invalidRecords) {
        const res = await api()[method]("/names/test" + route)
          .send({ privatekey: "a", a: record });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "a" });
      }
    });

    it("should not update when auth fails", async () => {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "c" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should reject when the name does not exist", async () => {
      const res = await api()[method]("/names/notfound" + route)
        .send({ privatekey: "d", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_not_found" });
    });

    it("should reject when not the owner of the name", async () => {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "b", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "not_name_owner" });
    });
  };

  const nameUpdate = (route, method) => () => {
    it("should update a name's a record", async () => {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "a", a: "example.com" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "example.com" });
      expect(res.body.name.updated).to.be.ok;
    });

    it("should exist in the database", async () => {
      const schemas = require("../../src/schemas");

      const name = await schemas.name.findOne();
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "example.com" });
    });

    it("should have created a transaction", async () => {
      const schemas = require("../../src/schemas");

      const tx = await schemas.transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k8juvewcui", to: "a", name: "test", op: "example.com", value: 0 });
    });

    it("should not have changed the owner's balance", async () => {
      const schemas = require("../../src/schemas");

      const address = await schemas.address.findOne({ where: { address: "k8juvewcui" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 10 });
    });

    it("should remove a name's a record", async () => {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "" });
      expect(res.body.name.updated).to.be.ok;
    });

    it("should exist in the database", async () => {
      const schemas = require("../../src/schemas");

      const name = await schemas.name.findOne();
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "" });
    });

    it("should have created a transaction", async () => {
      const schemas = require("../../src/schemas");

      const tx = await schemas.transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k8juvewcui", to: "a", name: "test", op: "", value: 0 });
    });

    it("should not have changed the owner's balance", async () => {
      const schemas = require("../../src/schemas");

      const address = await schemas.address.findOne({ where: { address: "k8juvewcui" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 10 });
    });
  };

  describe("POST /names/:name/update - validation", nameUpdateValidation("/update", "post"));
  describe("POST /names/:name/update", nameUpdate("/update", "post"));
  describe("PUT /names/:name - validation", nameUpdateValidation("", "put"));
  describe("PUT /names/:name", nameUpdate("", "put"));
});
