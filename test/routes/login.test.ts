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
import { api } from "../api.js";
import { seed } from "../seed.js";

describe("v2 routes: login", function() {
  before(seed);

  describe("POST /login", function() {
    it("should error with a missing privatekey", async function() {
      const res = await api().post("/login");
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should error with a blank privatekey", async function() {
      const res = await api().post("/login").send({ privatekey: "" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should error for v1", async function() {
      const res = await api().post("/login").query({ v: "1" }).send({ privatekey: "a" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "invalid_parameter", parameter: "v" });
    });

    it("should return with failed auth", async function() {
      const res = await api().post("/login").send({ privatekey: "c" });
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, authed: false });
    });

    it("should auth v2 addresses successfully", async function() {
      const res = await api().post("/login").send({ privatekey: "a" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, authed: true, address: "k8juvewcui" });
    });
  });
});
