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

import {
  isValidKristAddress, isValidName, stripNameSuffix
} from "../../src/utils";

describe("krist functions", () => {
  describe("isValidKristAddress", () => {
    it("should work for a valid v1 address", async () =>
      expect(isValidKristAddress("a5dfb396d3")).to.be.true);
    it("should work for a valid v2 address", async () =>
      expect(isValidKristAddress("k8juvewcui")).to.be.true);
    it("should fail for an invalid address", async () =>
      expect(isValidKristAddress("kfartoolong")).to.be.false);
    it("should fail for a valid v1 address when v2Only", async () =>
      expect(isValidKristAddress("a5dfb396d3", true)).to.be.false);
    it("should work for a valid v2 address when v2Only", async () =>
      expect(isValidKristAddress("k8juvewcui", true)).to.be.true);
    it("should fail for an invalid address when v2Only", async () =>
      expect(isValidKristAddress("kfartoolong", true)).to.be.false);
  });

  describe("isValidName", () => {
    it("should work for a valid name", async () =>
      expect(isValidName("test")).to.be.true);
    it("should not allow symbols", async () =>
      expect(isValidName("test[")).to.be.false);
    it("should not allow spaces", async () =>
      expect(isValidName("te st")).to.be.false);
    it("should not trim", async () =>
      expect(isValidName(" test ")).to.be.false);
    it("should not allow empty names", async () =>
      expect(isValidName("")).to.be.false);
    it("should not allow long names", async () =>
      expect(isValidName("a".repeat(65))).to.be.false);
    it("should error with undefined", async () =>
      expect(() => (isValidName as any)()).to.throw(TypeError));
    it("should not allow punycode prefixes", async () =>
      expect(isValidName("xn--test")).to.be.false);
    it("should allow punycode prefixes with fetching=true", async () =>
      expect(isValidName("xn--test", true)).to.be.true);
  });

  describe("stripNameSuffix", () => {
    it("should strip a .kst suffix", async () =>
      expect(stripNameSuffix("test.kst")).to.equal("test"));
    it("not alter a name without a suffix", async () =>
      expect(stripNameSuffix("test")).to.equal("test"));
    it("should only strip the last suffix", async () =>
      expect(stripNameSuffix("test.kst.kst")).to.equal("test.kst"));
    it("should not error with an undefined input", async () =>
      expect((stripNameSuffix as any)()).to.equal(""));
  });
});
