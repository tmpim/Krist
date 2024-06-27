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
import { isValidKristAddress, isValidName, stripNameSuffix } from "../../src/utils/index.js";

describe("krist functions", function() {
  describe("isValidKristAddress", function() {
    it("should work for a valid v1 address", async function() { return expect(isValidKristAddress("a5dfb396d3")).to.be.true; });

    it("should work for a valid v2 address", async function() { return expect(isValidKristAddress("k8juvewcui")).to.be.true; });

    it("should fail for an invalid address", async function() { return expect(isValidKristAddress("kfartoolong")).to.be.false; });

    it("should fail for a valid v1 address when v2Only", async function() { return expect(isValidKristAddress("a5dfb396d3", true)).to.be.false; });

    it("should work for a valid v2 address when v2Only", async function() { return expect(isValidKristAddress("k8juvewcui", true)).to.be.true; });

    it("should fail for an invalid address when v2Only", async function() { return expect(isValidKristAddress("kfartoolong", true)).to.be.false; });
  });

  describe("isValidName", function() {
    it("should work for a valid name", async function() { return expect(isValidName("test")).to.be.true; });

    it("should not allow symbols", async function() { return expect(isValidName("test[")).to.be.false; });

    it("should not allow spaces", async function() { return expect(isValidName("te st")).to.be.false; });

    it("should not trim", async function() { return expect(isValidName(" test ")).to.be.false; });

    it("should not allow empty names", async function() { return expect(isValidName("")).to.be.false; });

    it("should not allow long names", async function() { return expect(isValidName("a".repeat(65))).to.be.false; });

    it("should error with undefined", async function() { return expect(() => (isValidName as any)()).to.throw(TypeError); });

    it("should not allow punycode prefixes", async function() { return expect(isValidName("xn--test")).to.be.false; });

    it("should allow punycode prefixes with fetching=true", async function() { return expect(isValidName("xn--test", true)).to.be.true; });
  });

  describe("stripNameSuffix", function() {
    it("should strip a .kst suffix", async function() { return expect(stripNameSuffix("test.kst")).to.equal("test"); });

    it("not alter a name without a suffix", async function() { return expect(stripNameSuffix("test")).to.equal("test"); });

    it("should only strip the last suffix", async function() { return expect(stripNameSuffix("test.kst.kst")).to.equal("test.kst"); });

    it("should not error with an undefined input", async function() { return expect((stripNameSuffix as any)()).to.equal(""); });
  });
});
