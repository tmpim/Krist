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

import { Transaction } from "../../src/database";
import { transactionToJson } from "../../src/krist/transactions";

describe("schema to json", () => {
  before(seed);

  describe("transactionToJSON", () => {
    it("should convert a database transaction to json", async () => {
      const time = new Date();
      const tx = await Transaction.create({
        id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1,
        time, name: null, op: null
      });

      const out = transactionToJson(tx);

      expect(out).to.be.an("object");
      expect(out).to.deep.include({
        id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1,
        time: time.toISOString(), type: "transfer"
      });
    });
  });
});
