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
import { setWork } from "../../src/krist/work.js";

describe("v1 routes: work", () => {
  before(seed);

  describe("GET /?getwork", () => {
    it("should return the work", async () => {
      const res = await api().get("/?getwork");
      expect(res).to.have.status(200);
      expect(res).to.be.text;
      expect(res.text).to.equal("100000");
    });
  });
});

describe("v2 routes: work", () => {
  before(seed);

  describe("GET /work", () => {
    it("should return the work", async () => {
      const res = await api().get("/work");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, work: 100000 });
    });

    it("should return the work when it changes", async () => {
      await setWork(5000);

      const res = await api().get("/work");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, work: 5000 });
    });
  });

  describe("GET /work/day", () => {
    it("should return the work over time", async () => {
      const res = await api().get("/work/day");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body.work).to.be.an("array");
    });
  });

  describe("GET /work/detailed", () => {
    it("should return basic detailed work info", async () => {
      const res = await api().get("/work/detailed");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.deep.equal({
        ok: true,
        work: 5000, unpaid: 0,
        base_value: 25, block_value: 25,
        decrease: { value: 0, blocks: 0, reset: 0 }
      });
    });

    // TODO: more tests here with names
  });
});
