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

import { Name, Transaction } from "../../src/database";

describe("v2 routes: lookup api", () => {
  before(seed);

  // TODO: /lookup/addresses/:addresses
  // TODO: /lookup/transactions/:addresses
  // TODO: /lookup/blocks
  // TODO: /lookup/names

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
