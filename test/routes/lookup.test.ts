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
import { seed } from "../seed.js";
import { api } from "../api.js";

import { Name, Transaction } from "../../src/database/index.js";

describe("v2 routes: lookup api", () => {
  before(seed);

  // TODO: /lookup/transactions/:addresses
  // TODO: /lookup/blocks
  // TODO: /lookup/names

  describe("GET /lookup/addresses/:addresses", () => {
    it("should error with an invalid address", async () => {
      const res = await api().get("/lookup/addresses/invalid");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "addresses" });
    });

    it("should error with multiple addresses, where one is invalid", async () => {
      const res = await api().get("/lookup/addresses/k8juvewcui,invalid");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "addresses" });
    });

    it("should error with more than 128 addresses", async () => {
      const mkAddress = (i: number) => `k${i.toString().padStart(9, "0")}`
      const res = await api().get("/lookup/addresses/" + Array(129).fill(0).map((_, i) => mkAddress(i)).join(","));
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "addresses" });
    });

    it("should return null for a nonexistent address", async () => {
      const res = await api().get("/lookup/addresses/knotfound0");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, found: 0, notFound: 1 });
      expect(res.body.addresses).to.be.an("object");
      expect(res.body.addresses).to.deep.include({ knotfound0: null });
    });

    it("should lookup an address", async () => {
      const res = await api().get("/lookup/addresses/k8juvewcui");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, found: 1, notFound: 0 });
      expect(res.body.addresses).to.be.an("object");
      expect(res.body.addresses).to.have.all.keys("k8juvewcui");
      expect(res.body.addresses.k8juvewcui).to.be.an("object");
      expect(res.body.addresses.k8juvewcui).to.have.all.keys("address", "balance", "totalin", "totalout", "firstseen");
      expect(res.body.addresses.k8juvewcui).to.not.have.key("names");
    });

    it("should lookup multiple addresses", async () => {
      const res = await api().get("/lookup/addresses/k8juvewcui,k7oax47quv,knotfound0");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, found: 2, notFound: 1 });
      expect(res.body.addresses).to.be.an("object");
      expect(res.body.addresses).to.have.all.keys("k8juvewcui", "k7oax47quv", "knotfound0");
      expect(res.body.addresses.k8juvewcui).to.be.an("object");
      expect(res.body.addresses.k7oax47quv).to.be.an("object");
      expect(res.body.addresses.knotfound0).to.be.null;
    });

    it("should fetch names for an address", async () => {
      const res = await api().get("/lookup/addresses/k8juvewcui?fetchNames");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, found: 1, notFound: 0 });
      expect(res.body.addresses).to.be.an("object");
      expect(res.body.addresses).to.have.all.keys("k8juvewcui");
      expect(res.body.addresses.k8juvewcui).to.be.an("object");
      expect(res.body.addresses.k8juvewcui).to.have.all.keys("address", "balance", "totalin", "totalout", "firstseen", "names");
      expect(res.body.addresses.k8juvewcui.names).to.be.a("number");
    });
  });

  describe("GET /search", () => {
    it("should error with a missing query", async () => {
      const res = await api().get("/search");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "q" });
    });

    it("should error with a long query", async () => {
      const res = await api().get("/search").query({ q: "a".repeat(257) });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "q" });
    });

    it("should search for an address", async () => {
      const res = await api().get("/search").query({ q: "k8juvewcui" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.be.an("object");
      expect(res.body.query).to.deep.include({ matchAddress: true, matchName: true });
      expect(res.body.matches).to.be.an("object");
      expect(res.body.matches).to.deep.include({ exactName: false, exactBlock: false, exactTransaction: false });
      expect(res.body.matches.exactAddress).to.be.an("object");
      expect(res.body.matches.exactAddress).to.deep.include({ address: "k8juvewcui", balance: 10 });
    });

    it("should strip spaces", async () => {
      const res = await api().get("/search").query({ q: "k8juvewcui " });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ originalQuery: "k8juvewcui", matchAddress: true });
      expect(res.body.matches.exactAddress).to.deep.include({ address: "k8juvewcui", balance: 10 });
    });

    it("should create a temporary name to test", async () => {
      const name = await Name.create({ name: "test", owner: "k7oax47quv", registered: new Date(), unpaid: 0 });
      expect(name).to.exist;
      expect(name).to.deep.include({ name: "test", owner: "k7oax47quv" });
    });

    it("should search for a name", async () => {
      const res = await api().get("/search").query({ q: "test" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchAddress: false, matchName: true, strippedName: "test" });
      expect(res.body.matches).to.deep.include({ exactAddress: false, exactBlock: false, exactTransaction: false });
      expect(res.body.matches.exactName).to.be.an("object");
      expect(res.body.matches.exactName).to.deep.include({ name: "test", owner: "k7oax47quv" });
    });

    it("should search for a name with a .kst suffix", async () => {
      const res = await api().get("/search").query({ q: "test.kst" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchAddress: false, matchName: true, strippedName: "test" });
      expect(res.body.matches.exactName).to.be.an("object");
      expect(res.body.matches.exactName).to.deep.include({ name: "test", owner: "k7oax47quv" });
    });

    it("should search for a block", async () => {
      const res = await api().get("/search").query({ q: "1" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchBlock: true, hasID: true, cleanID: 1 });
      expect(res.body.matches).to.deep.include({ exactAddress: false, exactName: false, exactTransaction: false });
      expect(res.body.matches.exactBlock).to.be.an("object");
      expect(res.body.matches.exactBlock).to.deep.include({ hash: "0000000000000000000000000000000000000000000000000000000000000000" });
    });

    it("should create a transaction to test", async () => {
      const tx = await Transaction.create({ from: "k8juvewcui", to: "k7oax47quv", value: 1, time: new Date() });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k8juvewcui", to: "k7oax47quv", value: 1 });
    });

    it("should search for a transaction", async () => {
      const res = await api().get("/search").query({ q: "1" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchBlock: true, matchTransaction: true, hasID: true, cleanID: 1 });
      expect(res.body.matches).to.deep.include({ exactAddress: false, exactName: false });
      expect(res.body.matches.exactBlock).to.be.an("object");
      expect(res.body.matches.exactTransaction).to.be.an("object");
      expect(res.body.matches.exactTransaction).to.deep.include({ from: "k8juvewcui", to: "k7oax47quv", value: 1 });
    });
  });

  describe("GET /search/extended", () => {
    it("should error with a missing query", async () => {
      const res = await api().get("/search/extended");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "q" });
    });

    it("should error with a short query", async () => {
      const res = await api().get("/search/extended").query({ q: "aa" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "q" });
    });

    it("should error with a long query", async () => {
      const res = await api().get("/search/extended").query({ q: "a".repeat(257) });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "q" });
    });

    it("should search for a transaction by address", async () => {
      const res = await api().get("/search/extended").query({ q: "k8juvewcui" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.be.an("object");
      expect(res.body.query).to.deep.include({ matchAddress: true });
      expect(res.body.matches).to.be.an("object");
      expect(res.body.matches.transactions).to.be.an("object");
      expect(res.body.matches.transactions).to.deep.include({
        addressInvolved: 1,
        nameInvolved: false,
        metadata: 0
      });
    });

    it("should create a transaction to test", async () => {
      const tx = await Transaction.create({ from: "k7oax47quv", to: "a", value: 0, name: "test", op: "Hello, world!", time: new Date() });
      expect(tx).to.exist;
      expect(tx).to.deep.include({ from: "k7oax47quv", to: "a", value: 0, name: "test", op: "Hello, world!" });
    });

    it("should search for a transaction by name", async () => {
      const res = await api().get("/search/extended").query({ q: "test" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchName: true });
      expect(res.body.matches.transactions).to.deep.include({
        addressInvolved: false,
        nameInvolved: 1,
        metadata: 0
      });
    });

    it("should more test transactions", async () => {
      await Transaction.bulkCreate([
        { from: "k8juvewcui", to: "k7oax47quv", value: 1, op: "test", time: new Date() },
        { from: "k8juvewcui", to: "k7oax47quv", value: 1, op: "test.kst", time: new Date() },
        { from: "k8juvewcui", to: "k7oax47quv", value: 1, sent_name: "test", op: "test.kst", time: new Date() },
        { from: "k8juvewcui", to: "k7oax47quv", value: 1, sent_name: "test", sent_metaname: "meta@test.kst", op: "meta@test.kst", time: new Date() },
        { from: "k8juvewcui", to: "k7oax47quv", value: 1, sent_name: "test", op: "test.kst;Hello, world!", time: new Date() },
        { from: "k8juvewcui", to: "k7oax47quv", value: 1, sent_name: "test", sent_metaname: "meta@test.kst", op: "meta@test.kst;Hello, world!", time: new Date() }
      ]);
    });

    it("should search for transactions by name in metadata", async () => {
      const res = await api().get("/search/extended").query({ q: "test" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchName: true });
      expect(res.body.matches.transactions).to.deep.include({
        addressInvolved: false,
        nameInvolved: 5,
        metadata: 6
      });
    });

    it("should search for transactions by name in metadata with a .kst suffix", async () => {
      const res = await api().get("/search/extended").query({ q: "test.kst" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchName: true });
      expect(res.body.matches.transactions).to.deep.include({
        addressInvolved: false,
        nameInvolved: 5,
        metadata: 5
      });
    });

    it("should search for transactions by metadata", async () => {
      const res = await api().get("/search/extended").query({ q: "Hello, world!" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true });
      expect(res.body.query).to.deep.include({ matchName: false });
      expect(res.body.matches.transactions).to.deep.include({
        addressInvolved: false,
        nameInvolved: false,
        metadata: 3
      });
    });
  });
});
