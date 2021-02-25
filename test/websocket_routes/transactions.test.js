const { expect } = require("chai");

const { seed } = require("../seed");
const { newConnection } = require("../ws");

const expectTransactionExist = (id, to, metadata) => async () => {
  const schemas = require("../../src/schemas");

  const tx = await schemas.transaction.findByPk(id);
  expect(tx).to.exist;
  expect(tx).to.deep.include({ id, from: "k8juvewcui", to: to || "k7oax47quv", value: 1 });
  if (metadata) expect(tx.op).to.equal(metadata);
};

describe("websocket routes: transactions", function() {
  before(seed);
  this.retries(4);

  async function send(data, privatekey) {
    const ws = await newConnection(privatekey);
    expect(ws).to.nested.include({ "wsp.isOpened": true });

    const res = await ws.sendAndWait({ type: "make_transaction", ...data });
    expect(res).to.be.an("object");
    return res;
  }

  describe("make_transaction - validation", () => {
    it("should deny unauthed addresses", async () => {
      const res = await send({ to: "k7oax47quv", amount: 1, privatekey: "c" });
      expect(res).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should error with a missing 'privatekey' for guests", async () => {
      const res = await send({});
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should not error with a missing 'privatekey' for authed users", async () => {
      const res = await send({}, "a");
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "to" });
    });

    it("should error with a missing 'to'", async () => {
      const res = await send({ privatekey: "a" });
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "to" });
    });

    it("should error with a missing 'amount'", async () => {
      const res = await send({ to: "k7oax47quv", privatekey: "a" });
      expect(res).to.deep.include({ ok: false, error: "missing_parameter", parameter: "amount" });
    });

    it("should error with an invalid 'amount'", async () => {
      const amounts = ["a", 0, -1, "0", "-1"];
      for (const amount of amounts) {
        const res = await send({ amount, to: "k7oax47quv", privatekey: "a" });
        expect(res).to.deep.include({ ok: false, parameter: "amount" });
      }
    });

    it("should error with an invalid 'metadata'", async () => {
      const metadataList = ["\0", "\1", "a".repeat(256)];
      for (const metadata of metadataList) {
        const res = await send({ amount: 1, to: "k7oax47quv", privatekey: "a", metadata });
        expect(res).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "metadata" });
      }
    });

    it("should error with a non-existent sender", async () => {
      const res = await send({ amount: 1, to: "k7oax47quv", privatekey: "notfound" });
      expect(res).to.deep.include({ ok: false, error: "insufficient_funds" });
    });

    it("should error with insufficient funds", async () => {
      const res = await send({ amount: 11, to: "k7oax47quv", privatekey: "a" });
      expect(res).to.deep.include({ ok: false, error: "insufficient_funds" });
    });

    it("should error when paying to an invalid address", async () => {
      const res = await send({ amount: 1, to: "kfartoolong", privatekey: "a" });
      expect(res).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "to" });
    });

    it("should error when paying to a name that doesn't exist", async () => {
      const res = await send({ amount: 1, to: "notfound.kst", privatekey: "a" });
      expect(res).to.deep.include({ ok: false, error: "name_not_found" });
    });
  });

  describe("make_transaction", () => {
    it("should make a transaction", async () => {
      const res = await send({ amount: 1, to: "k7oax47quv", privatekey: "a" });
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.transaction.time).to.be.a("string");
      expect(res.transaction.name).to.not.be.ok;
      expect(res.transaction.metadata).to.not.be.ok;
    });
    it("should exist in the database", expectTransactionExist(1));

    it("should have altered the balances", async () => {
      const schemas = require("../../src/schemas");

      const from = await schemas.address.findOne({ where: { address: "k8juvewcui" }});
      expect(from).to.exist;
      expect(from.balance).to.equal(9);

      const to = await schemas.address.findOne({ where: { address: "k7oax47quv" }});
      expect(to).to.exist;
      expect(to.balance).to.equal(1);
    });

    it("should support metadata", async () => {
      const res = await send({ amount: 1, to: "k7oax47quv", privatekey: "a", metadata: "Hello, world!" });
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 2, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.transaction.metadata).to.equal("Hello, world!");
    });
    it("should exist in the database", expectTransactionExist(2, undefined, "Hello, world!"));

    it("should create a temporary name to test", async () => {
      const schemas = require("../../src/schemas");

      const name = await schemas.name.create({ name: "test", owner: "k7oax47quv", registered: new Date(), unpaid: 0 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k7oax47quv" });
    });

    it("should transact to a name's owner", async () => {
      const res = await send({ amount: 1, to: "test.kst", privatekey: "a" });
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 3, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.transaction.metadata).to.equal("test.kst");
    });

    it("should preserve existing metadata with a transaction to a name", async () => {
      const res = await send({ amount: 1, to: "test.kst", privatekey: "a", metadata: "Hello, world!" });
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 4, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.transaction.metadata).to.equal("test.kst;Hello, world!");
    });

    it("should support metanames", async () => {
      const res = await send({ amount: 1, to: "meta@test.kst", privatekey: "a" });
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 5, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.transaction.metadata).to.equal("meta@test.kst");
    });

    it("should support metanames and preserve metadata", async () => {
      const res = await send({ amount: 1, to: "meta@test.kst", privatekey: "a", metadata: "Hello, world!" });
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 6, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
      expect(res.transaction.metadata).to.equal("meta@test.kst;Hello, world!");
    });

    it("should transact to a new address", async () => {
      const res = await send({ amount: 1, to: "knotfound0", privatekey: "a" });
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 7, from: "k8juvewcui", to: "knotfound0", value: 1, type: "transfer" });
    });

    it("should have created that address", async () => {
      const schemas = require("../../src/schemas");

      const address = await schemas.address.findOne({ where: { address: "knotfound0" }});
      expect(address).to.exist;
      expect(address.balance).to.equal(1);
    });

    it("should make a transaction when authed", async () => {
      const res = await send({ amount: 1, to: "k7oax47quv" }, "a");
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 8, from: "k8juvewcui", to: "k7oax47quv", value: 1, type: "transfer" });
    });

    it("should make a transaction as another address when authed", async () => {
      const res = await send({ amount: 1, to: "k7oax47quv", privatekey: "d" }, "a");
      expect(res).to.deep.include({ ok: true });
      expect(res.transaction).to.be.an("object");
      expect(res.transaction).to.deep.include({ id: 9, from: "k0duvsr4qn", to: "k7oax47quv", value: 1, type: "transfer" });
    });
  });
});
