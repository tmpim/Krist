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
import {
  sanitiseLike,
  sanitiseLimit,
  sanitiseOffset,
  sanitiseOrigin,
  sanitiseUserAgent
} from "../../src/utils/index.js";
import { seed } from "../seed.js";

describe("utils", function() {
  before(seed);

  describe("sanitiseLimit", function() {
    it("should return the default with undefined", async function() { return expect(sanitiseLimit(undefined)).to.equal(50); });

    it("should return the default with null", async function() { return expect(sanitiseLimit(null)).to.equal(50); });

    it("should return the default with an empty string", async function() { return expect(sanitiseLimit("")).to.equal(50); });

    it("should return the default with whitespace", async function() { return expect(sanitiseLimit(" ")).to.equal(50); });

    it("should return the default with negative", async function() { return expect(sanitiseLimit(-1)).to.equal(50); });

    it("should return the default with NaN", async function() { return expect(sanitiseLimit(NaN)).to.equal(50); });

    it("should return the given default with undefined", async function() { return expect(sanitiseLimit(undefined, 5)).to.equal(5); });

    it("should return the given default with null", async function() { return expect(sanitiseLimit(null, 5)).to.equal(5); });

    it("should return the given default with an empty string", async function() { return expect(sanitiseLimit("", 5)).to.equal(5); });

    it("should return the given default with whitespace", async function() { return expect(sanitiseLimit(" ", 5)).to.equal(5); });

    it("should return the given default with negative", async function() { return expect(sanitiseLimit(-1, 5)).to.equal(5); });

    it("should return the given default with NaN", async function() { return expect(sanitiseLimit(NaN, 5)).to.equal(5); });

    it("should parse integers", async function() { return expect(sanitiseLimit("1")).to.equal(1); });

    it("should ignore decimals", async function() { return expect(sanitiseLimit("1.1")).to.equal(1); });

    it("should allow valid limits", async function() {
      for (let i = 0; i <= 1000; i++)
        expect(sanitiseLimit(i)).to.equal(i);
    });

    it("should not exceed the maximum", async function() { return expect(sanitiseLimit(1001)).to.equal(1000); });

    it("should not exceed a custom maximum", async function() { return expect(sanitiseLimit(51, undefined, 50)).to.equal(50); });
  });

  describe("sanitiseOffset", function() {
    it("should undefined", async function() { return expect(sanitiseOffset(undefined)).to.be.undefined; });

    it("should parse integers", async function() { return expect(sanitiseOffset("1")).to.equal(1); });

    it("should ignore decimals", async function() { return expect(sanitiseOffset("1.1")).to.equal(1); });

    it("should allow valid offsets", async function() { return expect(sanitiseOffset(1)).to.equal(1); });
  });

  describe("sanitiseLike", function() {
    it("should error with undefined", async function() { return expect(() => sanitiseLike()).to.throw(Error); });

    it("should pass through a regular string", async function() { return expect(sanitiseLike("foobar")).to.deep.equal({ val: ["'%foobar%'"] }); });

    it("should escape single quotes", async function() { return expect(sanitiseLike("foo'bar")).to.deep.equal({ val: ["'%foo\\'bar%'"] }); });

    it("should escape two single quotes", async function() { return expect(sanitiseLike("foo''bar")).to.deep.equal({ val: ["'%foo\\'\\'bar%'"] }); });

    it("should ignore backticks", async function() { return expect(sanitiseLike("foo`bar")).to.deep.equal({ val: ["'%foo`bar%'"] }); });

    it("should escape backslashes", async function() { return expect(sanitiseLike("foo\\bar")).to.deep.equal({ val: ["'%foo\\\\\\\\bar%'"] }); });

    it("should escape underscores", async function() { return expect(sanitiseLike("foo_bar")).to.deep.equal({ val: ["'%foo\\\\_bar%'"] }); });

    it("should escape percent", async function() { return expect(sanitiseLike("foo%bar")).to.deep.equal({ val: ["'%foo\\\\%bar%'"] }); });
  });

  describe("sanitiseUserAgent", function() {
    it("should return undefined for undefined", async function() { return expect(sanitiseUserAgent()).to.be.undefined; });

    it("should allow a valid string", async function() { return expect(sanitiseUserAgent("a")).to.equal("a"); });

    it("should truncate a long string", async function() { return expect(sanitiseUserAgent("a".repeat(256))).to.equal("a".repeat(255)); });
  });

  describe("sanitiseOrigin", function() {
    it("should return undefined for undefined", async function() { return expect(sanitiseOrigin()).to.be.undefined; });

    it("should allow a valid string", async function() { return expect(sanitiseOrigin("a")).to.equal("a"); });

    it("should truncate a long string", async function() { return expect(sanitiseOrigin("a".repeat(256))).to.equal("a".repeat(255)); });
  });
});
