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
import { Address, Name, Transaction } from "../../src/database/index.js";
import { getBlockValue } from "../../src/krist/blocks/index.js";
import { api } from "../api.js";
import { seed } from "../seed.js";

describe("v1 routes: names", function() {
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

  describe("/?name_new", function() {
    it("should be removed", async function() {
      const res = await api().get("/?name_new");
      expect(res).to.be.text;
      expect(res.text).to.equal("Please use the new API");
    });
  });

  describe("/?name_transfer", function() {
    it("should be removed", async function() {
      const res = await api().get("/?name_transfer");
      expect(res).to.be.text;
      expect(res.text).to.equal("Please use the new API");
    });
  });

  describe("/?name_update", function() {
    it("should be removed", async function() {
      const res = await api().get("/?name_update");
      expect(res).to.be.text;
      expect(res.text).to.equal("Please use the new API");
    });
  });
});

describe("v2 routes: names", function() {
  before(seed);

  // TODO: GET /names/check/:name
  // TODO: GET /names/cost
  // TODO: GET /names/bonus
  // TODO: GET /names
  // TODO: GET /names/new
  // TODO: GET /names/:name
  // TODO: GET /names/:name

  describe("POST /names/:name - validation", function() {
    it("should require a privatekey", async function() {
      const res = await api().post("/names/test");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should reject long names", async function() {
      const res = await api()
        .post("/names/" + "a".repeat(65))
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
    });

    it("should reject names with invalid characters", async function() {
      const invalidNames = ["test.kst", " ", "te st", "_"];
      for (const name of invalidNames) {
        const res = await api()
          .post("/names/" + encodeURIComponent(name))
          .send({ privatekey: "a" });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
      }
    });

    it("should not purchase a name when auth fails", async function() {
      const res = await api()
        .post("/names/test")
        .send({ privatekey: "c" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should reject names that already exist", async function() {
      const name = await Name.create({ name: "test2", owner: "k8juvewcui", original_owner: "k8juvewcui",
        registered: new Date(), unpaid: 0 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test2", owner: "k8juvewcui" });

      const res = await api()
        .post("/names/test2")
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_taken" });
    });

    it("should reject with insufficient funds", async function() {
      const res = await api()
        .post("/names/test")
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "insufficient_funds" });
    });
  });

  describe("POST /names/:name", function() {
    before(seed);

    it("should purchase a name", async function() {
      const res = await api()
        .post("/names/test")
        .send({ privatekey: "d" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
    });

    it("should exist in the database", async function() {
      const name = await Name.findOne();
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k0duvsr4qn", unpaid: 500, original_owner: "k0duvsr4qn" });
      expect(name!.registered).to.be.ok;
      expect(name!.updated).to.be.ok;
      expect(name!.transferred).to.be.null;
    });

    it("should have created a transaction", async function() {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k0duvsr4qn", to: "name", name: "test", value: 500 });
    });

    it("should have decreased the buyer's balance", async function() {
      const address = await Address.findOne({ where: { address: "k0duvsr4qn" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 24500 });
    });

    it("should have increased the block value", async function() {
      const value = await getBlockValue();
      expect(value).to.equal(26);
    });

    it("should convert names to lowercase", async function() {
      const res = await api()
        .post("/names/TestUppercase")
        .send({ privatekey: "d" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.be.ok;
      expect(res.body.name).to.deep.include({ name: "testuppercase" });

      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k0duvsr4qn", to: "name", name: "testuppercase", value: 500 });
    });
  });

  describe("POST /names/:name/transfer - validation", function() {
    it("should require a privatekey", async function() {
      const res = await api().post("/names/test/transfer");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should require an address", async function() {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "d" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "address" });
    });

    it("should reject invalid names", async function() {
      const res = await api()
        .post("/names/" + ("a".repeat(65)) + "/transfer")
        .send({ privatekey: "a", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
    });

    it("should reject invalid addresses", async function() {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "a", address: "kfartoolong" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
    });

    it("should reject v1 addresses", async function() {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "a", address: "a5dfb396d3" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "address" });
    });

    it("should not transfer a name when auth fails", async function() {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "c", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should reject when the name does not exist", async function() {
      const res = await api()
        .post("/names/notfound/transfer")
        .send({ privatekey: "d", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_not_found" });
    });

    it("should reject when not the owner of the name", async function() {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "a", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "not_name_owner" });
    });
  });

  describe("POST /names/:name/transfer", function() {
    it("should transfer a name", async function() {
      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "d", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", original_owner: "k0duvsr4qn" });
      expect(res.body.name.updated).to.be.ok;
      expect(res.body.name.transferred).to.be.ok;
    });

    it("should have updated the database", async function() {
      const name = await Name.findOne({ where: { name: "test" }});
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k8juvewcui", original_owner: "k0duvsr4qn" });
      expect(name!.updated).to.be.ok;
    });

    it("should have created a transaction", async function() {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k0duvsr4qn", to: "k8juvewcui", name: "test", value: 0 });
    });

    it("should not have changed the old owner's balance", async function() {
      const address = await Address.findOne({ where: { address: "k0duvsr4qn" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 24000 });
    });

    it("should not have changed the new owner's balance", async function() {
      const address = await Address.findOne({ where: { address: "k8juvewcui" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 10 });
    });

    it("should not bump a name", async function() {
      const name = await Name.findOne({ where: { name: "test" }});
      const oldUpdated = name!.updated;
      const oldTransferred = name!.transferred;
      expect(oldUpdated).to.be.ok;
      expect(oldTransferred).to.be.ok;

      const res = await api()
        .post("/names/test/transfer")
        .send({ privatekey: "a", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", original_owner: "k0duvsr4qn" });
      expect(res.body.name.updated).to.equal(oldUpdated!.toISOString());
      expect(res.body.name.transferred).to.equal(oldTransferred!.toISOString());
    });

    it("should not have created a transaction", async function() {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k0duvsr4qn", to: "k8juvewcui", name: "test", value: 0 });
    });
  });

  const nameUpdateValidation = (route: string, method: "post" | "put") => () => {
    it("should require a privatekey", async function() {
      const res = await api()[method]("/names/test" + route);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should reject long names", async function() {
      const res = await api()[method]("/names/" + "a".repeat(65) + route)
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
    });

    it("should reject names with invalid characters", async function() {
      const invalidNames = ["test.kst", " ", "te st", "_"];
      for (const name of invalidNames) {
        const res = await api()[method]("/names/" + encodeURIComponent(name) + route)
          .send({ privatekey: "a" });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "name" });
      }
    });

    const invalidRecords = ["#foo", "?foo", "foo bar", "a".repeat(256)];
    for (const record of invalidRecords) {
      it(`should reject invalid name data - ${JSON.stringify(record)}`, async function() {
        const res = await api()[method]("/names/test" + route)
          .send({ privatekey: "a", a: record });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "a" });
      });
    }

    it("should not update when auth fails", async function() {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "c" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
    });

    it("should reject when the name does not exist", async function() {
      const res = await api()[method]("/names/notfound" + route)
        .send({ privatekey: "d", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "name_not_found" });
    });

    it("should reject when not the owner of the name", async function() {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "b", address: "k8juvewcui" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "not_name_owner" });
    });
  };

  const nameUpdate = (route: string, method: "post" | "put") => () => {
    it("should update a name's data", async function() {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "a", a: "example.com" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "example.com", original_owner: "k0duvsr4qn" });
      expect(res.body.name.updated).to.be.ok;
    });

    it("should exist in the database", async function() {
      const name = await Name.findOne();
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "example.com", original_owner: "k0duvsr4qn" });
    });

    let tId = -1;
    it("should have created a transaction", async function() {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k8juvewcui", to: "a", name: "test", op: "example.com", value: 0 });
      tId = tx!.id;
    });

    it("should not have changed the owner's balance", async function() {
      const address = await Address.findOne({ where: { address: "k8juvewcui" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 10 });
    });

    it("should not bump a name", async function() {
      const name = await Name.findOne({ where: { name: "test" }});
      const oldUpdated = name!.updated;
      expect(oldUpdated).to.be.ok;

      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "a", a: "example.com" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "example.com", original_owner: "k0duvsr4qn" });
      expect(res.body.name.updated).to.equal(oldUpdated!.toISOString());
    });

    it("should not have created a transaction", async function() {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ id: tId, op: "example.com" });
    });

    it("should remove a name's data", async function() {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "a" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", a: null });
      expect(res.body.name.updated).to.be.ok;
    });

    it("should exist in the database", async function() {
      const name = await Name.findOne();
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k8juvewcui", a: null });
    });

    it("should have created a transaction", async function() {
      const tx = await Transaction.findOne({ order: [["id", "DESC"]] });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k8juvewcui", to: "a", name: "test", op: null, value: 0 });
    });

    it("should not have changed the owner's balance", async function() {
      const address = await Address.findOne({ where: { address: "k8juvewcui" }});
      expect(address).to.exist;
      expect(address).to.deep.include({ balance: 10 });
    });

    it("should nullify the name data if it is an empty string", async function() {
      const res = await api()[method]("/names/test" + route)
        .send({ privatekey: "a", a: "" });

      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", a: null });
      expect(res.body.name.updated).to.be.ok;
    });

    const trimRecords = [" foo", "foo ", " foo "];
    for (const record of trimRecords) {
      it(`should trim name data - ${JSON.stringify(record)}`, async function() {
        const res = await api()[method]("/names/test" + route)
          .send({ privatekey: "a", a: record });

        expect(res).to.be.json;
        expect(res.body).to.deep.include({ ok: true });
        expect(res.body.name).to.deep.include({ name: "test", owner: "k8juvewcui", a: "foo" });
      });
    }
  };

  describe("POST /names/:name/update - validation", nameUpdateValidation("/update", "post"));

  describe("POST /names/:name/update", nameUpdate("/update", "post"));

  describe("PUT /names/:name - validation", nameUpdateValidation("", "put"));

  describe("PUT /names/:name", nameUpdate("", "put"));
});
