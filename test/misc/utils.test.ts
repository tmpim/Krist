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

import {
  sanitiseLimit, sanitiseOffset, sanitiseLike, sanitiseUserAgent, sanitiseOrigin
} from "../../src/utils";

describe("utils", () => {
  before(seed);

  describe("sanitiseLimit", () => {
    it("should return the default with undefined", async () =>
      expect(sanitiseLimit(undefined)).to.equal(50));
    it("should return the default with null", async () =>
      expect(sanitiseLimit(null)).to.equal(50));
    it("should return the default with an empty string", async () =>
      expect(sanitiseLimit("")).to.equal(50));
    it("should return the default with whitespace", async () =>
      expect(sanitiseLimit(" ")).to.equal(50));
    it("should return the default with negative", async () =>
      expect(sanitiseLimit(-1)).to.equal(50));
    it("should return the default with NaN", async () =>
      expect(sanitiseLimit(NaN)).to.equal(50));

    it("should return the given default with undefined", async () =>
      expect(sanitiseLimit(undefined, 5)).to.equal(5));
    it("should return the given default with null", async () =>
      expect(sanitiseLimit(null, 5)).to.equal(5));
    it("should return the given default with an empty string", async () =>
      expect(sanitiseLimit("", 5)).to.equal(5));
    it("should return the given default with whitespace", async () =>
      expect(sanitiseLimit(" ", 5)).to.equal(5));
    it("should return the given default with negative", async () =>
      expect(sanitiseLimit(-1, 5)).to.equal(5));
    it("should return the given default with NaN", async () =>
      expect(sanitiseLimit(NaN, 5)).to.equal(5));

    it("should parse integers", async () =>
      expect(sanitiseLimit("1")).to.equal(1));
    it("should ignore decimals", async () =>
      expect(sanitiseLimit("1.1")).to.equal(1));

    it("should allow valid limits", async () => {
      for (let i = 0; i <= 1000; i++)
        expect(sanitiseLimit(i)).to.equal(i);
    });

    it("should not exceed the maximum", async () =>
      expect(sanitiseLimit(1001)).to.equal(1000));
    it("should not exceed a custom maximum", async () =>
      expect(sanitiseLimit(51, undefined, 50)).to.equal(50));
  });

  describe("sanitiseOffset", () => {
    it("should undefined", async () =>
      expect(sanitiseOffset(undefined)).to.be.undefined);
    it("should parse integers", async () =>
      expect(sanitiseOffset("1")).to.equal(1));
    it("should ignore decimals", async () =>
      expect(sanitiseOffset("1.1")).to.equal(1));
    it("should allow valid offsets", async () =>
      expect(sanitiseOffset(1)).to.equal(1));
  });

  describe("sanitiseLike", () => {
    it("should error with undefined", async () =>
      expect(() => sanitiseLike()).to.throw(Error));
    it("should pass through a regular string", async () =>
      expect(sanitiseLike("foobar")).to.deep.equal({ val: "'%foobar%'" }));
    it("should escape single quotes", async () =>
      expect(sanitiseLike("foo'bar")).to.deep.equal({ val: "'%foo\\'bar%'" }));
    it("should escape two single quotes", async () =>
      expect(sanitiseLike("foo''bar")).to.deep.equal({ val: "'%foo\\'\\'bar%'" }));
    it("should escape double quotes", async () =>
      expect(sanitiseLike("foo\"bar")).to.deep.equal({ val: "'%foo\\\"bar%'" }));
    it("should ignore backticks", async () =>
      expect(sanitiseLike("foo`bar")).to.deep.equal({ val: "'%foo`bar%'" }));
    it("should escape backslashes", async () =>
      expect(sanitiseLike("foo\\bar")).to.deep.equal({ val: "'%foo\\\\\\\\bar%'" }));
    it("should escape underscores", async () =>
      expect(sanitiseLike("foo_bar")).to.deep.equal({ val: "'%foo\\\\_bar%'" }));
    it("should escape percent", async () =>
      expect(sanitiseLike("foo%bar")).to.deep.equal({ val: "'%foo\\\\%bar%'" }));
  });

  describe("sanitiseUserAgent", () => {
    it("should return undefined for undefined", async () =>
      expect(sanitiseUserAgent()).to.be.undefined);
    it("should allow a valid string", async () =>
      expect(sanitiseUserAgent("a")).to.equal("a"));
    it("should truncate a long string", async () =>
      expect(sanitiseUserAgent("a".repeat(256))).to.equal("a".repeat(255)));
  });

  describe("sanitiseOrigin", () => {
    it("should return undefined for undefined", async () =>
      expect(sanitiseOrigin()).to.be.undefined);
    it("should allow a valid string", async () =>
      expect(sanitiseOrigin("a")).to.equal("a"));
    it("should truncate a long string", async () =>
      expect(sanitiseOrigin("a".repeat(256))).to.equal("a".repeat(255)));
  });
});
